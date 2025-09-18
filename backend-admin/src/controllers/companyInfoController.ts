import { Request, Response } from 'express';
import { CompanyInfo } from '../models/CompanyInfo';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/company');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export const companyInfoController = {
  // Get company information
  async getCompanyInfo(req: Request, res: Response) {
    try {
      let companyInfo = await CompanyInfo.findOne({ isActive: true });
      
      if (!companyInfo) {
        // Create default company info if none exists
        companyInfo = new CompanyInfo({
          isActive: true,
          lastModifiedBy: 'System'
        });
        await companyInfo.save();
      }
      
      return res.json(companyInfo);
    } catch (error) {
      console.error('Error getting company info:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Update company information
  async updateCompanyInfo(req: Request, res: Response) {
    try {
      const {
        companyName,
        companyEmail,
        companyPhone,
        companyWebsite,
        companyAddress,
        companyCity,
        companyState,
        companyZipCode,
        companyCountry,
        businessLicense,
        taxId,
        operatingHours,
        emergencyContact,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        linkedinUrl,
        description,
        missionStatement,
        termsOfService,
        privacyPolicy,
        lastModifiedBy
      } = req.body;

      let companyInfo = await CompanyInfo.findOne({ isActive: true });
      
      if (!companyInfo) {
        companyInfo = new CompanyInfo({
          isActive: true,
          lastModifiedBy: lastModifiedBy || 'Admin'
        });
      }

      // Update fields
      if (companyName !== undefined) companyInfo.companyName = companyName;
      if (companyEmail !== undefined) companyInfo.companyEmail = companyEmail;
      if (companyPhone !== undefined) companyInfo.companyPhone = companyPhone;
      if (companyWebsite !== undefined) companyInfo.companyWebsite = companyWebsite;
      if (companyAddress !== undefined) companyInfo.companyAddress = companyAddress;
      if (companyCity !== undefined) companyInfo.companyCity = companyCity;
      if (companyState !== undefined) companyInfo.companyState = companyState;
      if (companyZipCode !== undefined) companyInfo.companyZipCode = companyZipCode;
      if (companyCountry !== undefined) companyInfo.companyCountry = companyCountry;
      if (businessLicense !== undefined) companyInfo.businessLicense = businessLicense;
      if (taxId !== undefined) companyInfo.taxId = taxId;
      if (operatingHours !== undefined) companyInfo.operatingHours = operatingHours;
      if (emergencyContact !== undefined) companyInfo.emergencyContact = emergencyContact;
      if (primaryColor !== undefined) companyInfo.primaryColor = primaryColor;
      if (secondaryColor !== undefined) companyInfo.secondaryColor = secondaryColor;
      if (accentColor !== undefined) companyInfo.accentColor = accentColor;
      if (backgroundColor !== undefined) companyInfo.backgroundColor = backgroundColor;
      if (textColor !== undefined) companyInfo.textColor = textColor;
      if (facebookUrl !== undefined) companyInfo.facebookUrl = facebookUrl;
      if (instagramUrl !== undefined) companyInfo.instagramUrl = instagramUrl;
      if (twitterUrl !== undefined) companyInfo.twitterUrl = twitterUrl;
      if (linkedinUrl !== undefined) companyInfo.linkedinUrl = linkedinUrl;
      if (description !== undefined) companyInfo.description = description;
      if (missionStatement !== undefined) companyInfo.missionStatement = missionStatement;
      if (termsOfService !== undefined) companyInfo.termsOfService = termsOfService;
      if (privacyPolicy !== undefined) companyInfo.privacyPolicy = privacyPolicy;

      companyInfo.lastModified = new Date();
      companyInfo.lastModifiedBy = lastModifiedBy || 'Admin';

      await companyInfo.save();

      return res.json({ 
        message: 'Company information updated successfully',
        companyInfo 
      });
    } catch (error) {
      console.error('Error updating company info:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Upload logo
  async uploadLogo(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const logoUrl = `/uploads/company/${req.file.filename}`;
      
      let companyInfo = await CompanyInfo.findOne({ isActive: true });
      if (!companyInfo) {
        companyInfo = new CompanyInfo({
          isActive: true,
          lastModifiedBy: 'Admin'
        });
      }

      // Delete old logo if exists
      if (companyInfo.logoUrl) {
        const oldLogoPath = path.join(__dirname, '../../public', companyInfo.logoUrl);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      companyInfo.logoUrl = logoUrl;
      companyInfo.lastModified = new Date();
      companyInfo.lastModifiedBy = 'Admin';

      await companyInfo.save();

      return res.json({ 
        message: 'Logo uploaded successfully',
        logoUrl: logoUrl,
        companyInfo 
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete logo
  async deleteLogo(req: Request, res: Response) {
    try {
      const companyInfo = await CompanyInfo.findOne({ isActive: true });
      if (!companyInfo) {
        return res.status(404).json({ message: 'Company information not found' });
      }

      if (companyInfo.logoUrl) {
        const logoPath = path.join(__dirname, '../../public', companyInfo.logoUrl);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
      }

      companyInfo.logoUrl = '';
      companyInfo.lastModified = new Date();
      companyInfo.lastModifiedBy = 'Admin';

      await companyInfo.save();

      return res.json({ 
        message: 'Logo deleted successfully',
        companyInfo 
      });
    } catch (error) {
      console.error('Error deleting logo:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get available variables for email templates
  async getEmailVariables(req: Request, res: Response) {
    try {
      const companyInfo = await CompanyInfo.findOne({ isActive: true });
      if (!companyInfo) {
        return res.status(404).json({ message: 'Company information not found' });
      }

      const variables = {
        // Company basic info
        companyName: companyInfo.companyName,
        companyEmail: companyInfo.companyEmail,
        companyPhone: companyInfo.companyPhone,
        companyWebsite: companyInfo.companyWebsite,
        companyAddress: companyInfo.companyAddress,
        companyCity: companyInfo.companyCity,
        companyState: companyInfo.companyState,
        companyZipCode: companyInfo.companyZipCode,
        companyCountry: companyInfo.companyCountry,
        fullAddress: `${companyInfo.companyAddress}, ${companyInfo.companyCity}, ${companyInfo.companyState} ${companyInfo.companyZipCode}, ${companyInfo.companyCountry}`,
        
        // Business info
        businessLicense: companyInfo.businessLicense,
        taxId: companyInfo.taxId,
        operatingHours: companyInfo.operatingHours,
        emergencyContact: companyInfo.emergencyContact,
        
        // Branding
        logoUrl: companyInfo.logoUrl,
        primaryColor: companyInfo.primaryColor,
        secondaryColor: companyInfo.secondaryColor,
        accentColor: companyInfo.accentColor,
        backgroundColor: companyInfo.backgroundColor,
        textColor: companyInfo.textColor,
        
        // Social media
        facebookUrl: companyInfo.facebookUrl,
        instagramUrl: companyInfo.instagramUrl,
        twitterUrl: companyInfo.twitterUrl,
        linkedinUrl: companyInfo.linkedinUrl,
        
        // Additional info
        description: companyInfo.description,
        missionStatement: companyInfo.missionStatement,
        termsOfService: companyInfo.termsOfService,
        privacyPolicy: companyInfo.privacyPolicy
      };

      return res.json(variables);
    } catch (error) {
      console.error('Error getting email variables:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Export upload middleware
export const uploadLogo = upload.single('logo');
