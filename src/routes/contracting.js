const express = require('express');
const contractingService = require('../services/contractingService');
const logger = require('../utils/logger');
// const { authentifizierung } = require('../middleware/auth'); // Commented out for Ops/Import ease of testing

const router = express.Router();

/**
 * @swagger
 * /api/v1/contracting/import:
 *   post:
 *     summary: Import signed contract from Sales Funnel
 *     tags: [Contracting Service]
 *     description: Entry point for new contracts. Creates drafts and initiates verification.
 */
router.post('/import', async (req, res, next) => {
  try {
    const result = await contractingService.importContract(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Contract import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- OPS FRONTEND ENDPOINTS ---

/**
 * @swagger
 * /api/v1/contracting/ops/campaigns:
 *   get:
 *     summary: List all tariff campaigns
 *     tags: [Ops Frontend]
 */
router.get('/ops/campaigns', async (req, res, next) => {
  try {
    const campaigns = await contractingService.getCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    logger.error('Ops campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/contracting/ops/marketing-campaigns:
 *   get:
 *     summary: List all marketing/voucher campaigns
 *     tags: [Ops Frontend]
 */
router.get('/ops/marketing-campaigns', async (req, res, next) => {
  try {
    const campaigns = await contractingService.getMarketingCampaigns();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    logger.error('Ops marketing campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/contracting/ops/marketing-campaigns:
 *   post:
 *     summary: Create a new marketing/voucher campaign
 *     tags: [Ops Frontend]
 */
router.post('/ops/marketing-campaigns', async (req, res, next) => {
  try {
    const result = await contractingService.createMarketingCampaign(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Ops create marketing campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/contracting/ops/contracts:
 *   get:
 *     summary: List contract drafts (searchable by customerId)
 *     tags: [Ops Frontend]
 */
router.get('/ops/contracts', async (req, res, next) => {
  try {
    const { customerId } = req.query;
    const drafts = await contractingService.getContractDrafts(customerId);
    res.json({ success: true, data: drafts });
  } catch (error) {
    logger.error('Ops contracts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/contracting/ops/malo-drafts/{contractId}:
 *   get:
 *     summary: Get MaLo drafts for a contract
 *     tags: [Ops Frontend]
 */
router.get('/ops/malo-drafts/:contractId', async (req, res, next) => {
  try {
    const drafts = await contractingService.getMaLoDrafts(req.params.contractId);
    res.json({ success: true, data: drafts });
  } catch (error) {
    logger.error('Ops MaLo drafts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/contracting/ops/malo-drafts/{id}:
 *   put:
 *     summary: Update MaLo draft data (Manual intervention)
 *     tags: [Ops Frontend]
 */
router.put('/ops/malo-drafts/:id', async (req, res, next) => {
  try {
    // In real app, get userId from auth token
    const userId = 'admin-user'; 
    const result = await contractingService.updateMaLoDraft(req.params.id, req.body, userId);
    res.json(result);
  } catch (error) {
    logger.error('Ops update MaLo error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/contracting/ops/confirm-switch:
 *   post:
 *     summary: Confirm switch and move to final CustomerMaLo
 *     tags: [Ops Frontend]
 */
router.post('/ops/confirm-switch', async (req, res, next) => {
  try {
    const { draftId } = req.body;
    const userId = 'admin-user';
    const result = await contractingService.confirmSwitch(draftId, userId);
    res.json(result);
  } catch (error) {
    logger.error('Ops confirm switch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;