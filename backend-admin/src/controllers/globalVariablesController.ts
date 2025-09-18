import { Request, Response } from 'express';
import { GlobalVariablesService } from '../services/globalVariablesService';

export class GlobalVariablesController {
  /**
   * Get global variables for a specific booking
   */
  static async getGlobalVariables(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      
      if (!bookingId) {
        res.status(400).json({ error: 'Booking ID is required' });
        return;
      }

      const variables = await GlobalVariablesService.getGlobalVariables(bookingId);
      
      res.json({
        success: true,
        data: variables
      });
    } catch (error) {
      console.error('Error getting global variables:', error);
      res.status(500).json({ 
        error: 'Error getting global variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update global variables for a specific booking
   */
  static async updateGlobalVariables(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      
      if (!bookingId) {
        res.status(400).json({ error: 'Booking ID is required' });
        return;
      }

      await GlobalVariablesService.updateGlobalVariables(bookingId);
      
      res.json({
        success: true,
        message: 'Global variables updated successfully'
      });
    } catch (error) {
      console.error('Error updating global variables:', error);
      res.status(500).json({ 
        error: 'Error updating global variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update a specific variable for a booking
   */
  static async updateSpecificVariable(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, variableKey } = req.params;
      const { value } = req.body;
      
      if (!bookingId || !variableKey) {
        res.status(400).json({ error: 'Booking ID and variable key are required' });
        return;
      }

      if (value === undefined) {
        res.status(400).json({ error: 'Value is required' });
        return;
      }

      await GlobalVariablesService.updateSpecificVariable(bookingId, variableKey, value);
      
      res.json({
        success: true,
        message: `Variable ${variableKey} updated successfully`,
        data: { variableKey, value }
      });
    } catch (error) {
      console.error('Error updating specific variable:', error);
      res.status(500).json({ 
        error: 'Error updating specific variable',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available variable keys and descriptions
   */
  static async getAvailableVariables(req: Request, res: Response): Promise<void> {
    try {
      const variables = GlobalVariablesService.getAvailableVariables();
      
      res.json({
        success: true,
        data: variables
      });
    } catch (error) {
      console.error('Error getting available variables:', error);
      res.status(500).json({ 
        error: 'Error getting available variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Replace variables in a template
   */
  static async replaceVariablesInTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, template } = req.body;
      
      if (!bookingId || !template) {
        res.status(400).json({ error: 'Booking ID and template are required' });
        return;
      }

      const variables = await GlobalVariablesService.getGlobalVariables(bookingId);
      const result = GlobalVariablesService.replaceVariables(template, variables);
      
      res.json({
        success: true,
        data: {
          originalTemplate: template,
          processedTemplate: result,
          variables: variables
        }
      });
    } catch (error) {
      console.error('Error replacing variables in template:', error);
      res.status(500).json({ 
        error: 'Error replacing variables in template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Bulk update global variables for multiple bookings
   */
  static async bulkUpdateGlobalVariables(req: Request, res: Response): Promise<void> {
    try {
      const { bookingIds } = req.body;
      
      if (!bookingIds || !Array.isArray(bookingIds)) {
        res.status(400).json({ error: 'Booking IDs array is required' });
        return;
      }

      const results = [];
      const errors = [];

      for (const bookingId of bookingIds) {
        try {
          await GlobalVariablesService.updateGlobalVariables(bookingId);
          results.push({ bookingId, status: 'success' });
        } catch (error) {
          errors.push({ 
            bookingId, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        data: {
          total: bookingIds.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors
        }
      });
    } catch (error) {
      console.error('Error in bulk update global variables:', error);
      res.status(500).json({ 
        error: 'Error in bulk update global variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 