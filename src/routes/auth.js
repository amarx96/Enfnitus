const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validieren, schemas } = require('../middleware/validation');
const database = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - street
 *         - houseNumber
 *         - plz
 *         - city
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "max.mustermann@example.com"
 *         password:
 *           type: string
 *           minLength: 8
 *           example: "SecurePass123!"
 *         firstName:
 *           type: string
 *           example: "Max"
 *         lastName:
 *           type: string
 *           example: "Mustermann"
 *         phone:
 *           type: string
 *           example: "+49 30 12345678"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 *         street:
 *           type: string
 *           example: "Musterstraße"
 *         houseNumber:
 *           type: string
 *           example: "123"
 *         plz:
 *           type: string
 *           pattern: '^[0-9]{5}$'
 *           example: "10115"
 *         city:
 *           type: string
 *           example: "Berlin"
 *         district:
 *           type: string
 *           example: "Mitte"
 *         annualConsumption:
 *           type: integer
 *           minimum: 500
 *           maximum: 50000
 *           example: 3500
 *         householdSize:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           example: 3
 *         preferredLanguage:
 *           type: string
 *           enum: [de, vi, en]
 *           example: "de"
 *         marketingConsent:
 *           type: boolean
 *           example: false
 *         newsletterConsent:
 *           type: boolean
 *           example: true
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "max.mustermann@example.com"
 *         password:
 *           type: string
 *           example: "SecurePass123!"
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             customer:
 *               type: object
 *               properties:
 *                 customerId:
 *                   type: string
 *                   example: "cust_1234567890"
 *                 email:
 *                   type: string
 *                   example: "max.mustermann@example.com"
 *                 firstName:
 *                   type: string
 *                   example: "Max"
 *                 lastName:
 *                   type: string
 *                   example: "Mustermann"
 *                 isVerified:
 *                   type: boolean
 *                   example: false
 *             token:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new customer
 *     description: Create a new customer account with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data or email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', validieren(schemas.kundenRegistrierung), async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      street,
      houseNumber,
      plz,
      city,
      district,
      annualConsumption,
      householdSize,
      preferredLanguage,
      marketingConsent,
      newsletterConsent
    } = req.body;

    // Check if customer already exists
    const existingCustomer = await database.query(
      'SELECT email FROM customers WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ein Kunde mit dieser E-Mail-Adresse existiert bereits'
      });
    }

    // Validate PLZ exists in our database
    const plzCheck = await database.query(
      'SELECT plz, city FROM plz_data WHERE plz = $1 LIMIT 1',
      [plz]
    );

    if (plzCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Diese Postleitzahl wird derzeit nicht von uns beliefert'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate customer ID and verification token
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const verificationToken = uuidv4();

    // Start transaction
    await database.transaction(async (client) => {
      // Insert customer
      const customerResult = await client.query(`
        INSERT INTO customers (
          customer_id, email, password_hash, first_name, last_name, phone, date_of_birth,
          street, house_number, plz, city, district, preferred_language,
          marketing_consent, newsletter_consent, verification_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING customer_id, email, first_name, last_name, is_active, is_verified, created_at
      `, [
        customerId,
        email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone || null,
        dateOfBirth || null,
        street,
        houseNumber,
        plz,
        city,
        district || null,
        preferredLanguage || 'de',
        marketingConsent || false,
        newsletterConsent || false,
        verificationToken
      ]);

      const customer = customerResult.rows[0];

      // Insert customer meta data if provided
      if (annualConsumption || householdSize) {
        await client.query(`
          INSERT INTO customer_metas (
            customer_id, annual_consumption_kwh, household_size
          ) VALUES ($1, $2, $3)
        `, [
          customerId,
          annualConsumption || null,
          householdSize || null
        ]);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: customer.customer_id,
          email: customer.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      logger.info('New customer registered', {
        customerId: customer.customer_id,
        email: customer.email,
        plz,
        city
      });

      res.status(201).json({
        success: true,
        message: 'Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail-Adresse.',
        data: {
          customer: {
            customerId: customer.customer_id,
            email: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            isActive: customer.is_active,
            isVerified: customer.is_verified,
            createdAt: customer.created_at
          },
          token
        }
      });
    });

  } catch (error) {
    logger.error('Customer registration error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Customer login
 *     description: Authenticate customer with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive or not verified
 *       500:
 *         description: Server error
 */
router.post('/login', validieren(schemas.kundenAnmeldung), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get customer from database
    const result = await database.query(
      `SELECT 
        customer_id, email, password_hash, first_name, last_name, 
        is_active, is_verified, last_login
      FROM customers 
      WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige E-Mail-Adresse oder Passwort'
      });
    }

    const customer = result.rows[0];

    // Check if account is active
    if (!customer.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Kundenservice.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige E-Mail-Adresse oder Passwort'
      });
    }

    // Update last login
    await database.query(
      'UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE customer_id = $1',
      [customer.customer_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: customer.customer_id,
        email: customer.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info('Customer login successful', {
      customerId: customer.customer_id,
      email: customer.email
    });

    res.json({
      success: true,
      message: 'Anmeldung erfolgreich',
      data: {
        customer: {
          customerId: customer.customer_id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          isActive: customer.is_active,
          isVerified: customer.is_verified,
          lastLogin: customer.last_login
        },
        token
      }
    });

  } catch (error) {
    logger.error('Customer login error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verify customer email address
 *     description: Verify customer email using verification token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find customer with verification token
    const result = await database.query(
      'SELECT customer_id, email, is_verified FROM customers WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger oder abgelaufener Bestätigungslink'
      });
    }

    const customer = result.rows[0];

    if (customer.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'E-Mail-Adresse wurde bereits bestätigt'
      });
    }

    // Update customer as verified
    await database.query(
      'UPDATE customers SET is_verified = true, verification_token = NULL WHERE customer_id = $1',
      [customer.customer_id]
    );

    logger.info('Customer email verified', {
      customerId: customer.customer_id,
      email: customer.email
    });

    res.json({
      success: true,
      message: 'E-Mail-Adresse wurde erfolgreich bestätigt'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email to customer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'E-Mail-Adresse ist erforderlich'
      });
    }

    // Check if customer exists
    const result = await database.query(
      'SELECT customer_id, email, first_name FROM customers WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet.'
      });
    }

    const customer = result.rows[0];

    // Generate password reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token
    await database.query(
      'UPDATE customers SET password_reset_token = $1, password_reset_expires = $2 WHERE customer_id = $3',
      [resetToken, resetExpires, customer.customer_id]
    );

    logger.info('Password reset requested', {
      customerId: customer.customer_id,
      email: customer.email
    });

    // In a real application, you would send an email here
    // For demo purposes, we'll just return success
    res.json({
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet.',
      // In development, include the reset token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset customer password
 *     description: Reset customer password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token, or weak password
 *       500:
 *         description: Server error
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token und neues Passwort sind erforderlich'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Das Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten'
      });
    }

    // Find customer with valid reset token
    const result = await database.query(
      'SELECT customer_id, email FROM customers WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger oder abgelaufener Reset-Token'
      });
    }

    const customer = result.rows[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await database.query(
      'UPDATE customers SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE customer_id = $2',
      [passwordHash, customer.customer_id]
    );

    logger.info('Password reset successful', {
      customerId: customer.customer_id,
      email: customer.email
    });

    res.json({
      success: true,
      message: 'Passwort wurde erfolgreich zurückgesetzt'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
});

module.exports = router;