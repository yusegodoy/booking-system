import express from 'express';
import { companyInfoController, uploadLogo } from '../controllers/companyInfoController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get company information (public endpoint for email variables)
router.get('/', companyInfoController.getCompanyInfo);

// Get email variables (public endpoint)
router.get('/email-variables', companyInfoController.getEmailVariables);
router.get('/logo-image', companyInfoController.getLogoImage);

// Admin routes (require authentication)
router.put('/', auth, companyInfoController.updateCompanyInfo);
router.post('/upload-logo', auth, uploadLogo, companyInfoController.uploadLogo);
router.delete('/logo', auth, companyInfoController.deleteLogo);

export default router;
