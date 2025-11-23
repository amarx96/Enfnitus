const express = require('express');
const { validieren, schemas } = require('../middleware/validation');
const { authentifizierung } = require('../middleware/auth');
const logger = require('../utils/logger');
const customerService = require('../services/customerService');
const { testConnection } = require('../config/supabase');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomerProfile:
 *       type: object
 *       properties:
 *         customerId:
 *           type: string
 *           example: "cust_1234567890"
 *         email:
 *           type: string
 *           format: email
 *           example: "max.mustermann@example.com"
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
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *               example: "Musterstraße"
 *             houseNumber:
 *               type: string
 *               example: "123"
 *             plz:
 *               type: string
 *               example: "10115"
 *             city:
 *               type: string
 *               example: "Berlin"
 *             district:
 *               type: string
 *               example: "Mitte"
 *             country:
 *               type: string
 *               example: "Germany"
 *         preferences:
 *           type: object
 *           properties:
 *             preferredLanguage:
 *               type: string
 *               enum: [de, vi, en]
 *               example: "de"
 *             marketingConsent:
 *               type: boolean
 *               example: false
 *             newsletterConsent:
 *               type: boolean
 *               example: true
 *         energyProfile:
 *           type: object
 *           properties:
 *             annualConsumption:
 *               type: integer
 *               example: 3500
 *             householdSize:
 *               type: integer
 *               example: 3
 *             heatingType:
 *               type: string
 *               example: "gas"
 *             hasElectricVehicle:
 *               type: boolean
 *               example: false
 *             hasSolarPanels:
 *               type: boolean
 *               example: false
 *             hasHeatPump:
 *               type: boolean
 *               example: false
 *         account:
 *           type: object
 *           properties:
 *             isActive:
 *               type: boolean
 *               example: true
 *             isVerified:
 *               type: boolean
 *               example: true
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 *             lastLogin:
 *               type: string
 *               format: date-time
 *               example: "2024-11-02T08:15:00Z"
 *     
 *     UpdateCustomerRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Max"
 *         lastName:
 *           type: string
 *           example: "Mustermann"
 *         phone:
 *           type: string
 *           example: "+49 30 12345678"
 *         street:
 *           type: string
 *           example: "Neue Straße"
 *         houseNumber:
 *           type: string
 *           example: "456"
 *         plz:
 *           type: string
 *           pattern: '^[0-9]{5}$'
 *           example: "10117"
 *         city:
 *           type: string
 *           example: "Berlin"
 *         district:
 *           type: string
 *           example: "Mitte"
 *         preferredLanguage:
 *           type: string
 *           enum: [de, vi, en]
 *           example: "vi"
 *         marketingConsent:
 *           type: boolean
 *           example: true
 *         newsletterConsent:
 *           type: boolean
 *           example: false
 */

/**
 * @swagger
 * /api/v1/customers/profile:
 *   get:
 *     summary: Get customer profile
 *     description: Retrieve the complete profile of the authenticated customer
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CustomerProfile'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customer:
 *   post:
 *     summary: Create new customer
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vorname
 *               - nachname
 *               - strasse
 *               - hausnummer
 *               - plz
 *               - ort
 *               - email
 *             properties:
 *               vorname:
 *                 type: string
 *               nachname:
 *                 type: string
 *               strasse:
 *                 type: string
 *               hausnummer:
 *                 type: string
 *               plz:
 *                 type: string
 *               ort:
 *                 type: string
 *               email:
 *                 type: string
 *               telefon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res, next) => {
  try {
    const customerData = req.body;
    
    // Validate required fields
    const requiredFields = ['vorname', 'nachname', 'strasse', 'hausnummer', 'plz', 'ort', 'email'];
    for (const field of requiredFields) {
      if (!customerData[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Create customer using Supabase service
    const result = await customerService.createCustomer(customerData);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Customer created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Error creating customer:', error);
    next(error);
  }
});

router.get('/profil', authentifizierung, async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;

    // Get customer basic information
    const customerResult = await database.query(`
      SELECT 
        customer_id, email, first_name, last_name, phone, date_of_birth,
        street, house_number, plz, city, district, country,
        preferred_language, marketing_consent, newsletter_consent,
        is_active, is_verified, created_at, last_login
      FROM customers 
      WHERE customer_id = $1
    `, [customerId]);

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customer = customerResult.rows[0];

    // Get customer meta information (energy profile)
    const metaResult = await database.query(`
      SELECT 
        annual_consumption_kwh, household_size, meter_number, meter_location_identifier,
        previous_provider_name, previous_provider_code, previous_annual_consumption_kwh,
        supplier_change_date, schufa_score, schufa_check_date, identity_verified,
        identity_verification_date, heating_type, has_electric_vehicle,
        has_solar_panels, has_heat_pump
      FROM customer_metas 
      WHERE customer_id = $1
    `, [customerId]);

    const meta = metaResult.rows[0] || {};

    // Build response
    const profile = {
      customerId: customer.customer_id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      dateOfBirth: customer.date_of_birth,
      address: {
        street: customer.street,
        houseNumber: customer.house_number,
        plz: customer.plz,
        city: customer.city,
        district: customer.district,
        country: customer.country
      },
      preferences: {
        preferredLanguage: customer.preferred_language,
        marketingConsent: customer.marketing_consent,
        newsletterConsent: customer.newsletter_consent
      },
      energyProfile: {
        annualConsumption: meta.annual_consumption_kwh,
        householdSize: meta.household_size,
        meterNumber: meta.meter_number,
        meterLocationIdentifier: meta.meter_location_identifier,
        heatingType: meta.heating_type,
        hasElectricVehicle: meta.has_electric_vehicle,
        hasSolarPanels: meta.has_solar_panels,
        hasHeatPump: meta.has_heat_pump
      },
      previousSupplier: meta.previous_provider_name ? {
        providerName: meta.previous_provider_name,
        providerCode: meta.previous_provider_code,
        annualConsumption: meta.previous_annual_consumption_kwh,
        changeDate: meta.supplier_change_date
      } : null,
      verification: {
        isVerified: customer.is_verified,
        identityVerified: meta.identity_verified,
        identityVerificationDate: meta.identity_verification_date,
        schufaScore: meta.schufa_score,
        schufaCheckDate: meta.schufa_check_date
      },
      account: {
        isActive: customer.is_active,
        isVerified: customer.is_verified,
        createdAt: customer.created_at,
        lastLogin: customer.last_login
      }
    };

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    logger.error('Get customer profile error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/customers/profile:
 *   put:
 *     summary: Update customer profile
 *     description: Update the profile information of the authenticated customer
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomerRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/CustomerProfile'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.put('/profil', authentifizierung, validieren(schemas.kundeAktualisieren), async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;
    const {
      firstName,
      lastName,
      phone,
      street,
      houseNumber,
      plz,
      city,
      district,
      preferredLanguage,
      marketingConsent,
      newsletterConsent
    } = req.body;

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`);
      updateValues.push(firstName);
      paramIndex++;
    }
    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex}`);
      updateValues.push(lastName);
      paramIndex++;
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      updateValues.push(phone);
      paramIndex++;
    }
    if (street !== undefined) {
      updateFields.push(`street = $${paramIndex}`);
      updateValues.push(street);
      paramIndex++;
    }
    if (houseNumber !== undefined) {
      updateFields.push(`house_number = $${paramIndex}`);
      updateValues.push(houseNumber);
      paramIndex++;
    }
    if (plz !== undefined) {
      updateFields.push(`plz = $${paramIndex}`);
      updateValues.push(plz);
      paramIndex++;
    }
    if (city !== undefined) {
      updateFields.push(`city = $${paramIndex}`);
      updateValues.push(city);
      paramIndex++;
    }
    if (district !== undefined) {
      updateFields.push(`district = $${paramIndex}`);
      updateValues.push(district);
      paramIndex++;
    }
    if (preferredLanguage !== undefined) {
      updateFields.push(`preferred_language = $${paramIndex}`);
      updateValues.push(preferredLanguage);
      paramIndex++;
    }
    if (marketingConsent !== undefined) {
      updateFields.push(`marketing_consent = $${paramIndex}`);
      updateValues.push(marketingConsent);
      paramIndex++;
    }
    if (newsletterConsent !== undefined) {
      updateFields.push(`newsletter_consent = $${paramIndex}`);
      updateValues.push(newsletterConsent);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Validate PLZ if provided
    if (plz) {
      const plzCheck = await database.query(
        'SELECT plz FROM plz_data WHERE plz = $1 LIMIT 1',
        [plz]
      );

      if (plzCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Diese Postleitzahl wird derzeit nicht von uns beliefert'
        });
      }
    }

    // Update customer
    updateValues.push(customerId);
    const updateQuery = `
      UPDATE customers 
      SET ${updateFields.join(', ')}
      WHERE customer_id = $${paramIndex}
      RETURNING customer_id
    `;

    await database.query(updateQuery, updateValues);

    logger.info('Customer profile updated', {
      customerId,
      updatedFields: updateFields.map(field => field.split(' = ')[0])
    });

    // Return updated profile
    const updatedProfileResult = await database.query(`
      SELECT 
        customer_id, email, first_name, last_name, phone, date_of_birth,
        street, house_number, plz, city, district, country,
        preferred_language, marketing_consent, newsletter_consent,
        is_active, is_verified, created_at, last_login
      FROM customers 
      WHERE customer_id = $1
    `, [customerId]);

    const customer = updatedProfileResult.rows[0];

    res.json({
      success: true,
      message: 'Profil wurde erfolgreich aktualisiert',
      data: {
        customerId: customer.customer_id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        dateOfBirth: customer.date_of_birth,
        address: {
          street: customer.street,
          houseNumber: customer.house_number,
          plz: customer.plz,
          city: customer.city,
          district: customer.district,
          country: customer.country
        },
        preferences: {
          preferredLanguage: customer.preferred_language,
          marketingConsent: customer.marketing_consent,
          newsletterConsent: customer.newsletter_consent
        },
        account: {
          isActive: customer.is_active,
          isVerified: customer.is_verified,
          createdAt: customer.created_at,
          lastLogin: customer.last_login
        }
      }
    });

  } catch (error) {
    logger.error('Update customer profile error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/customers/energy-profile:
 *   put:
 *     summary: Update energy profile
 *     description: Update the energy consumption and household information
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               annualConsumption:
 *                 type: integer
 *                 minimum: 500
 *                 maximum: 50000
 *                 example: 4200
 *               householdSize:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 example: 4
 *               meterNumber:
 *                 type: string
 *                 example: "12345678"
 *               heatingType:
 *                 type: string
 *                 enum: [gas, electric, oil, renewable]
 *                 example: "gas"
 *               hasElectricVehicle:
 *                 type: boolean
 *                 example: true
 *               hasSolarPanels:
 *                 type: boolean
 *                 example: false
 *               hasHeatPump:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Energy profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.put('/energie-profil', authentifizierung, async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;
    const {
      annualConsumption,
      householdSize,
      meterNumber,
      heatingType,
      hasElectricVehicle,
      hasSolarPanels,
      hasHeatPump
    } = req.body;

    // Check if customer meta record exists
    const existingMeta = await database.query(
      'SELECT customer_id FROM customer_metas WHERE customer_id = $1',
      [customerId]
    );

    if (existingMeta.rows.length === 0) {
      // Create new meta record
      await database.query(`
        INSERT INTO customer_metas (
          customer_id, annual_consumption_kwh, household_size, meter_number,
          heating_type, has_electric_vehicle, has_solar_panels, has_heat_pump
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        customerId,
        annualConsumption || null,
        householdSize || null,
        meterNumber || null,
        heatingType || null,
        hasElectricVehicle || false,
        hasSolarPanels || false,
        hasHeatPump || false
      ]);
    } else {
      // Update existing record
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (annualConsumption !== undefined) {
        updateFields.push(`annual_consumption_kwh = $${paramIndex}`);
        updateValues.push(annualConsumption);
        paramIndex++;
      }
      if (householdSize !== undefined) {
        updateFields.push(`household_size = $${paramIndex}`);
        updateValues.push(householdSize);
        paramIndex++;
      }
      if (meterNumber !== undefined) {
        updateFields.push(`meter_number = $${paramIndex}`);
        updateValues.push(meterNumber);
        paramIndex++;
      }
      if (heatingType !== undefined) {
        updateFields.push(`heating_type = $${paramIndex}`);
        updateValues.push(heatingType);
        paramIndex++;
      }
      if (hasElectricVehicle !== undefined) {
        updateFields.push(`has_electric_vehicle = $${paramIndex}`);
        updateValues.push(hasElectricVehicle);
        paramIndex++;
      }
      if (hasSolarPanels !== undefined) {
        updateFields.push(`has_solar_panels = $${paramIndex}`);
        updateValues.push(hasSolarPanels);
        paramIndex++;
      }
      if (hasHeatPump !== undefined) {
        updateFields.push(`has_heat_pump = $${paramIndex}`);
        updateValues.push(hasHeatPump);
        paramIndex++;
      }

      if (updateFields.length > 0) {
        updateValues.push(customerId);
        const updateQuery = `
          UPDATE customer_metas 
          SET ${updateFields.join(', ')}
          WHERE customer_id = $${paramIndex}
        `;
        await database.query(updateQuery, updateValues);
      }
    }

    logger.info('Customer energy profile updated', {
      customerId,
      annualConsumption,
      householdSize
    });

    res.json({
      success: true,
      message: 'Energieprofil wurde erfolgreich aktualisiert'
    });

  } catch (error) {
    logger.error('Update energy profile error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/customers/consumption-history:
 *   get:
 *     summary: Get consumption history
 *     description: Get historical energy consumption data for the customer
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *         description: Filter by year
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 12
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: Consumption history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalConsumption:
 *                           type: integer
 *                           example: 3456
 *                         averageMonthly:
 *                           type: number
 *                           example: 288.0
 *                         period:
 *                           type: string
 *                           example: "2024"
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             example: "2024-01"
 *                           consumption:
 *                             type: integer
 *                             example: 320
 *                           cost:
 *                             type: number
 *                             example: 89.50
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/verbrauchshistorie', authentifizierung, async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;
    const { year, limit = 12 } = req.query;

    // For demo purposes, return mock data
    // In a real implementation, this would query actual meter reading data
    const currentYear = year || new Date().getFullYear();
    
    const mockHistory = [];
    for (let month = 1; month <= Math.min(12, limit); month++) {
      // Generate realistic consumption data
      const baseConsumption = 250;
      const seasonalVariation = month <= 3 || month >= 11 ? 50 : -30; // Higher in winter
      const randomVariation = Math.floor(Math.random() * 40) - 20;
      const consumption = baseConsumption + seasonalVariation + randomVariation;
      
      mockHistory.push({
        period: `${currentYear}-${month.toString().padStart(2, '0')}`,
        consumption: consumption,
        cost: Math.round((consumption * 0.28 + 9.90) * 100) / 100, // Approximate cost
        unit: 'kWh'
      });
    }

    const totalConsumption = mockHistory.reduce((sum, item) => sum + item.consumption, 0);
    const averageMonthly = Math.round((totalConsumption / mockHistory.length) * 100) / 100;

    res.json({
      success: true,
      data: {
        summary: {
          totalConsumption,
          averageMonthly,
          period: currentYear.toString(),
          unit: 'kWh'
        },
        history: mockHistory.reverse() // Most recent first
      }
    });

  } catch (error) {
    logger.error('Get consumption history error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/customers/delete-account:
 *   delete:
 *     summary: Delete customer account
 *     description: Deactivate the customer account (soft delete)
 *     tags: [Customer Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for account deletion
 *                 example: "Moving to another country"
 *               feedback:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional feedback
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.delete('/konto-loeschen', authentifizierung, async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;
    const { reason, feedback } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for account deletion is required'
      });
    }

    // Check for active contracts
    const activeContracts = await database.query(
      'SELECT contract_id FROM contracts WHERE customer_id = $1 AND status = $2',
      [customerId, 'active']
    );

    if (activeContracts.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active contracts. Please terminate all contracts first.'
      });
    }

    // Deactivate account (soft delete)
    await database.query(
      'UPDATE customers SET is_active = false WHERE customer_id = $1',
      [customerId]
    );

    logger.info('Customer account deactivated', {
      customerId,
      reason,
      feedback: feedback ? 'provided' : 'none'
    });

    res.json({
      success: true,
      message: 'Your account has been deactivated successfully'
    });

  } catch (error) {
    logger.error('Delete customer account error:', error);
    next(error);
  }
});

module.exports = router;