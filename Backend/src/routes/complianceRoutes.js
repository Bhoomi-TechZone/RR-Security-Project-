import express from 'express';
import {
  getComplianceConfig,
  updateExpiryConfig,
  saveExpiryRule,
  deleteExpiryRule,
  saveVerificationRule,
  deleteVerificationRule,
  updatePoliceConfig,
  getExpiryTracker,
  sendExpiryAlertNotification,
} from '../controllers/complianceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to protect routes if token is provided, otherwise fallback gracefully
router.use((req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
});

// 1. Get entire compliance configuration from MongoDB
router.get('/config', getComplianceConfig);

// 2. Global Expiry Alert Settings
router.put('/expiry-config', updateExpiryConfig);

// 3. Document-Specific Expiry Rules
router.post('/expiry-rules', saveExpiryRule);
router.delete('/expiry-rules/:id', deleteExpiryRule);

// 4. Verification Rules
router.post('/verification-rules', saveVerificationRule);
router.delete('/verification-rules/:id', deleteVerificationRule);

// 5. Police Verification Governance Configuration
router.put('/police-config', updatePoliceConfig);

// 6. Live Dynamic Workforce License Expiry Tracker
router.get('/expiry-tracker', getExpiryTracker);

// 7. Dispatch Expiry Alert Notification
router.post('/send-alert', sendExpiryAlertNotification);

export default router;
