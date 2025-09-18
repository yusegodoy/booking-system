import { Request, Response } from 'express';
import { ServiceAgreement } from '../models/ServiceAgreement';

export const serviceAgreementController = {
  // Get the active service agreement
  async getServiceAgreement(req: Request, res: Response) {
    try {
      const agreement = await ServiceAgreement.findOne({ isActive: true });
      
      if (!agreement) {
        return res.status(404).json({ message: 'No active service agreement found' });
      }
      
      return res.json(agreement);
    } catch (error) {
      console.error('Error getting service agreement:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Create or update service agreement
  async updateServiceAgreement(req: Request, res: Response) {
    try {
      const {
        title,
        content,
        htmlContent,
        lastModifiedBy
      } = req.body;

      if (!title || !content || !htmlContent) {
        return res.status(400).json({ 
          message: 'Title, content, and htmlContent are required' 
        });
      }

      // Deactivate current active agreement
      await ServiceAgreement.updateMany(
        { isActive: true },
        { isActive: false }
      );

      // Get the highest version number
      const latestAgreement = await ServiceAgreement.findOne().sort({ version: -1 });
      const newVersion = latestAgreement ? latestAgreement.version + 1 : 1;

      // Create new agreement
      const agreement = new ServiceAgreement({
        title,
        content,
        htmlContent,
        isActive: true,
        version: newVersion,
        lastModified: new Date(),
        lastModifiedBy: lastModifiedBy || 'Admin'
      });

      await agreement.save();

      return res.json({ 
        message: 'Service agreement updated successfully',
        agreement 
      });
    } catch (error) {
      console.error('Error updating service agreement:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get service agreement history
  async getServiceAgreementHistory(req: Request, res: Response) {
    try {
      const agreements = await ServiceAgreement.find()
        .sort({ version: -1 })
        .limit(10); // Get last 10 versions
      
      return res.json(agreements);
    } catch (error) {
      console.error('Error getting service agreement history:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Restore a specific version
  async restoreServiceAgreement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { lastModifiedBy } = req.body;

      const agreement = await ServiceAgreement.findById(id);
      if (!agreement) {
        return res.status(404).json({ message: 'Service agreement not found' });
      }

      // Deactivate current active agreement
      await ServiceAgreement.updateMany(
        { isActive: true },
        { isActive: false }
      );

      // Get the highest version number
      const latestAgreement = await ServiceAgreement.findOne().sort({ version: -1 });
      const newVersion = latestAgreement ? latestAgreement.version + 1 : 1;

      // Create new agreement based on the restored version
      const restoredAgreement = new ServiceAgreement({
        title: agreement.title,
        content: agreement.content,
        htmlContent: agreement.htmlContent,
        isActive: true,
        version: newVersion,
        lastModified: new Date(),
        lastModifiedBy: lastModifiedBy || 'Admin'
      });

      await restoredAgreement.save();

      return res.json({ 
        message: 'Service agreement restored successfully',
        agreement: restoredAgreement 
      });
    } catch (error) {
      console.error('Error restoring service agreement:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete a specific version (only if not active)
  async deleteServiceAgreement(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const agreement = await ServiceAgreement.findById(id);
      if (!agreement) {
        return res.status(404).json({ message: 'Service agreement not found' });
      }

      if (agreement.isActive) {
        return res.status(400).json({ 
          message: 'Cannot delete active service agreement' 
        });
      }

      await ServiceAgreement.findByIdAndDelete(id);

      return res.json({ message: 'Service agreement deleted successfully' });
    } catch (error) {
      console.error('Error deleting service agreement:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};
