/**
 * Voucher Routes für API
 */

const express = require('express');
const { validieren, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');
const voucherService = require('../services/voucherService');

const router = express.Router();

/**
 * @swagger
 * /api/v1/voucher/validate:
 *   post:
 *     summary: Voucher Code validieren
 *     tags: [Voucher]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucherCode
 *               - tariffId
 *             properties:
 *               voucherCode:
 *                 type: string
 *                 example: "WELCOME2025"
 *               tariffId:
 *                 type: string
 *                 example: "standard-10115"
 *     responses:
 *       200:
 *         description: Voucher-Validierung erfolgreich
 *       400:
 *         description: Ungültige Anfrage
 *       404:
 *         description: Voucher nicht gefunden
 */
router.post('/validate', async (req, res) => {
  try {
    const { voucherCode, tariffId } = req.body;

    // Input-Validierung
    if (!voucherCode || !tariffId) {
      return res.status(400).json({
        erfolg: false,
        nachricht: 'Voucher Code und Tarif ID sind erforderlich',
        fehlerCode: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Voucher validieren
    const validationResult = await voucherService.validateVoucherCode(voucherCode, tariffId);

    if (validationResult.isValid) {
      return res.status(200).json({
        erfolg: true,
        nachricht: validationResult.message,
        daten: {
          voucherCode: voucherCode.toUpperCase(),
          isValid: true,
          discounts: validationResult.discounts,
          voucher: {
            campaignId: validationResult.voucher.campaign_id,
            startDate: validationResult.voucher.start_date,
            endDate: validationResult.voucher.end_date
          }
        }
      });
    } else {
      return res.status(400).json({
        erfolg: false,
        nachricht: validationResult.message,
        fehlerCode: validationResult.code,
        daten: {
          voucherCode: voucherCode.toUpperCase(),
          isValid: false
        }
      });
    }

  } catch (error) {
    logger.error('Voucher validation error:', error);
    return res.status(500).json({
      erfolg: false,
      nachricht: 'Fehler bei der Voucher-Validierung',
      fehlerCode: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/voucher/apply:
 *   post:
 *     summary: Voucher auf Tarif anwenden
 *     tags: [Voucher]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucherCode
 *               - tariff
 *             properties:
 *               voucherCode:
 *                 type: string
 *               tariff:
 *                 type: object
 *     responses:
 *       200:
 *         description: Voucher erfolgreich angewendet
 */
router.post('/apply', async (req, res) => {
  try {
    const { voucherCode, tariff } = req.body;

    if (!voucherCode || !tariff) {
      return res.status(400).json({
        erfolg: false,
        nachricht: 'Voucher Code und Tarif-Daten sind erforderlich',
        fehlerCode: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Voucher validieren
    const validationResult = await voucherService.validateVoucherCode(voucherCode, tariff.id);

    if (!validationResult.isValid) {
      return res.status(400).json({
        erfolg: false,
        nachricht: validationResult.message,
        fehlerCode: validationResult.code
      });
    }

    // Voucher anwenden
    const discountResult = voucherService.applyVoucherDiscount(tariff, validationResult.voucher);

    return res.status(200).json({
      erfolg: true,
      nachricht: 'Voucher erfolgreich angewendet',
      daten: {
        originalTariff: discountResult.originalTariff,
        discountedTariff: discountResult.discountedTariff,
        savings: discountResult.savings,
        voucherDetails: {
          code: voucherCode.toUpperCase(),
          campaignId: validationResult.voucher.campaign_id,
          workingPriceDiscount: validationResult.voucher.discount_working_price,
          basePriceDiscount: validationResult.voucher.discount_base_price
        }
      }
    });

  } catch (error) {
    logger.error('Voucher application error:', error);
    return res.status(500).json({
      erfolg: false,
      nachricht: 'Fehler beim Anwenden des Vouchers',
      fehlerCode: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/voucher/track-usage:
 *   post:
 *     summary: Voucher-Nutzung tracken
 *     tags: [Voucher]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucherCode
 *               - customerId
 *               - tariffId
 *               - originalCost
 *               - discountedCost
 *     responses:
 *       200:
 *         description: Voucher-Nutzung erfolgreich getrackt
 */
router.post('/track-usage', async (req, res) => {
  try {
    const { voucherCode, customerId, tariffId, originalCost, discountedCost } = req.body;

    // Voucher ID ermitteln
    const { supabase } = require('../config/supabase');
    const { data: voucher, error } = await supabase
      .from('voucher_codes')
      .select('id')
      .eq('voucher_code', voucherCode.toUpperCase())
      .single();

    if (error || !voucher) {
      return res.status(404).json({
        erfolg: false,
        nachricht: 'Voucher Code nicht gefunden',
        fehlerCode: 'VOUCHER_NOT_FOUND'
      });
    }

    // Nutzung tracken
    const trackingSuccess = await voucherService.trackVoucherUsage(
      voucher.id,
      customerId,
      tariffId,
      originalCost,
      discountedCost
    );

    if (trackingSuccess) {
      return res.status(200).json({
        erfolg: true,
        nachricht: 'Voucher-Nutzung erfolgreich getrackt'
      });
    } else {
      return res.status(500).json({
        erfolg: false,
        nachricht: 'Fehler beim Tracking der Voucher-Nutzung',
        fehlerCode: 'TRACKING_ERROR'
      });
    }

  } catch (error) {
    logger.error('Voucher tracking error:', error);
    return res.status(500).json({
      erfolg: false,
      nachricht: 'Fehler beim Tracking der Voucher-Nutzung',
      fehlerCode: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/voucher/list:
 *   get:
 *     summary: Aktive Voucher Codes auflisten (Admin)
 *     tags: [Voucher]
 *     responses:
 *       200:
 *         description: Liste der aktiven Voucher Codes
 */
router.get('/list', async (req, res) => {
  try {
    const vouchers = await voucherService.getActiveVouchers();

    return res.status(200).json({
      erfolg: true,
      nachricht: 'Aktive Voucher Codes abgerufen',
      daten: {
        vouchers: vouchers.map(v => ({
          code: v.voucher_code,
          campaignId: v.campaign_id,
          tariffId: v.tariff_id,
          startDate: v.start_date,
          endDate: v.end_date,
          discounts: {
            workingPrice: v.discount_working_price,
            basePrice: v.discount_base_price
          },
          usage: {
            current: v.current_usage_count,
            maximum: v.max_usage_count
          }
        })),
        total: vouchers.length
      }
    });

  } catch (error) {
    logger.error('Voucher list error:', error);
    return res.status(500).json({
      erfolg: false,
      nachricht: 'Fehler beim Abrufen der Voucher Codes',
      fehlerCode: 'INTERNAL_SERVER_ERROR'
    });
  }
});

module.exports = router;