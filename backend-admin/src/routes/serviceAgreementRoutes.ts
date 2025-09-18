import express from 'express';
import { serviceAgreementController } from '../controllers/serviceAgreementController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get active service agreement (public endpoint for email variables)
router.get('/', serviceAgreementController.getServiceAgreement);

// Admin routes (require authentication)
router.put('/', auth, serviceAgreementController.updateServiceAgreement);
router.get('/history', auth, serviceAgreementController.getServiceAgreementHistory);
router.post('/restore/:id', auth, serviceAgreementController.restoreServiceAgreement);
router.delete('/:id', auth, serviceAgreementController.deleteServiceAgreement);

export default router;
