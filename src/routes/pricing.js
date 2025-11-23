const express = require('express');
const { validieren, schemas } = require('../middleware/validation');
const pricingService = require('../services/pricingService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PriceCalculationRequest:
 *       type: object
 *       required:
 *         - plz
 *       properties:
 *         plz:
 *           type: string
 *           pattern: '^[0-9]{5}$'
 *           description: German postal code (5 digits)
 *           example: "10115"
 *         annualConsumption:
 *           type: integer
 *           minimum: 500
 *           maximum: 50000
 *           description: Annual electricity consumption in kWh
 *           example: 3500
 *         householdSize:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Number of people in household
 *           example: 3
 *         tariffType:
 *           type: string
 *           enum: [fixed, dynamic, green]
 *           description: Preferred tariff type
 *           example: "fixed"
 *     
 *     PriceCalculationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             location:
 *               type: object
 *               properties:
 *                 plz:
 *                   type: string
 *                   example: "10115"
 *                 city:
 *                   type: string
 *                   example: "Berlin"
 *                 district:
 *                   type: string
 *                   example: "Mitte"
 *                 gridProvider:
 *                   type: string
 *                   example: "Stromnetz Berlin"
 *             tariffs:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tariffId:
 *                     type: integer
 *                     example: 1
 *                   tariffName:
 *                     type: string
 *                     example: "Fix12"
 *                   tariffType:
 *                     type: string
 *                     example: "fixed"
 *                   contractDuration:
 *                     type: integer
 *                     example: 12
 *                   pricing:
 *                     type: object
 *                     properties:
 *                       workingPrice:
 *                         type: number
 *                         example: 28.50
 *                       basePrice:
 *                         type: number
 *                         example: 9.90
 *                       gridFees:
 *                         type: number
 *                         example: 6.50
 *                       taxes:
 *                         type: number
 *                         example: 7.30
 *                       renewableSurcharge:
 *                         type: number
 *                         example: 3.75
 *                   estimatedCosts:
 *                     type: object
 *                     properties:
 *                       annualConsumption:
 *                         type: integer
 *                         example: 3500
 *                       energyCosts:
 *                         type: number
 *                         example: 997.50
 *                       baseCosts:
 *                         type: number
 *                         example: 118.80
 *                       totalAnnualCosts:
 *                         type: number
 *                         example: 1116.30
 *                       monthlyCosts:
 *                         type: number
 *                         example: 93.03
 */

/**
 * @swagger
 * /api/v1/pricing/calculate:
 *   post:
 *     summary: Calculate electricity price for given location and consumption
 *     description: Returns available tariffs and pricing for a specific PLZ with estimated costs
 *     tags: [Pricing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PriceCalculationRequest'
 *     responses:
 *       200:
 *         description: Price calculation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceCalculationResponse'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: No pricing data available for this PLZ
 *       500:
 *         description: Server error
 */
router.post('/berechnen', validieren(schemas.preisBerechnung), async (req, res, next) => {
  try {
    const { plz, jahresverbrauch, haushaltgroesse = 2, tariftyp = 'standard', funnelId } = req.body;
    
    logger.info('Pricing calculation requested', { 
      plz, 
      jahresverbrauch, 
      haushaltgroesse, 
      tariftyp,
      funnelId
    });

    // Check if postal code is supported
    if (!pricingService.isPostalCodeSupported(plz)) {
      return res.status(404).json({
        erfolg: false,
        nachricht: `Postleitzahl ${plz} wird derzeit nicht unterstützt. Verfügbare Gebiete: Berlin und Umgebung.`,
        unterstuetzte_plz: pricingService.getSupportedPostalCodes().slice(0, 10) // Show first 10 as example
      });
    }

    // Calculate pricing using our pricing service
    // Uses Rabot Energy integration
    const pricingResult = await pricingService.calculatePricing(
      plz,
      jahresverbrauch,
      haushaltgroesse,
      tariftyp,
      funnelId
    );

    logger.info('Pricing calculation successful', { 
      plz,
      tariff_count: pricingResult.daten.tarife.length,
      monthly_cost: pricingResult.daten.tarife[0]?.kosten?.monatliche_kosten
    });

    res.json(pricingResult);

  } catch (error) {
    logger.error('Pricing calculation failed', { 
      error: error.message,
      plz: req.body.plz
    });

    if (error.message.includes('not found') || error.message.includes('not available')) {
      return res.status(404).json({
        erfolg: false,
        nachricht: error.message
      });
    }

    res.status(500).json({
      erfolg: false,
      nachricht: 'Ein Fehler ist bei der Preisberechnung aufgetreten. Bitte versuchen Sie es später erneut.'
    });
  }
});

// Ops Routes for Margins
router.get('/ops/margins', async (req, res) => {
  try {
    const margins = await pricingService.getMargins();
    res.json({ success: true, data: margins });
  } catch (error) {
    logger.error('Failed to fetch margins', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/ops/margins', async (req, res) => {
  try {
    await pricingService.updateMargin(req.body);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update margin', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;