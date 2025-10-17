const express = require('express');
const router = express.Router();
const domainVerificationService = require('../services/domainVerificationService');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/domain-verification/verify
 * @desc    Verify if a domain exists and is reachable
 * @access  Private
 */
router.post('/verify', auth, async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Domain is required'
      });
    }

    console.log(`Verifying domain: ${domain}`);

    const result = await domainVerificationService.verifyDomain(domain);

    res.json({
      success: true,
      domain: domain,
      isValid: result.isValid,
      error: result.error,
      details: result.details
    });

  } catch (error) {
    console.error('Domain verification API error:', error);
    res.status(500).json({
      success: false,
      error: 'Domain verification failed',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/domain-verification/cache-stats
 * @desc    Get domain verification cache statistics
 * @access  Private (Admin only)
 */
router.get('/cache-stats', auth, async (req, res) => {
  try {
    const stats = domainVerificationService.getCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

/**
 * @route   DELETE /api/domain-verification/cache
 * @desc    Clear domain verification cache
 * @access  Private (Admin only)
 */
router.delete('/cache', auth, async (req, res) => {
  try {
    const { domain } = req.body;
    domainVerificationService.clearCache(domain);
    
    res.json({
      success: true,
      message: domain ? `Cache cleared for ${domain}` : 'All cache cleared'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

module.exports = router;
