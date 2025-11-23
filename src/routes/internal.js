const express = require('express');
const { testConnection } = require('../config/supabase');

const router = express.Router();

/**
 * Simple internal health endpoint to verify Supabase connectivity
 * from the running backend (e.g. on Railway).
 *
 * GET /api/v1/internal/supabase
 * -> { success: true }  if the connection works
 * -> { success: false, message } with HTTP 500 on failure
 */
router.get('/supabase', async (req, res) => {
  try {
    const ok = await testConnection();
    if (!ok) {
      return res.status(500).json({
        success: false,
        message: 'Supabase connection test failed',
      });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Supabase connection test failed',
    });
  }
});

module.exports = router;


