import express from 'express';
import { emailController } from '../controllers/emailController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Email Configuration routes
router.get('/config', auth, emailController.getEmailConfig);
router.put('/config', auth, emailController.updateEmailConfig);
router.post('/config/test', auth, emailController.testEmailConfig);
// Diagnostics
router.get('/diagnostics', auth, emailController.runSmtpDiagnostics);

// Email Templates routes
router.get('/templates', auth, emailController.getEmailTemplates);
router.get('/templates/:id', auth, emailController.getEmailTemplate);
router.post('/templates', auth, emailController.createEmailTemplate);
router.put('/templates/:id', auth, emailController.updateEmailTemplate);
router.delete('/templates/:id', auth, emailController.deleteEmailTemplate);

// Email Variables
router.get('/variables', auth, emailController.getAvailableVariables);

// Send emails
router.post('/send', auth, emailController.sendTemplateEmail);

// Test email templates
router.post('/templates/test', auth, emailController.testEmailTemplate);

export default router;
