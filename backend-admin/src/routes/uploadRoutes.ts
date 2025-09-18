import express from 'express';
import upload from '../middleware/uploadMiddleware';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ruta para subir imagen de vehículo
router.post('/vehicle-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Generar la URL relativa para la imagen
    const imageUrl = `/uploads/vehicles/${req.file.filename}`;
    
    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        imageUrl: imageUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
});

// Ruta para eliminar imagen de vehículo
router.delete('/vehicle-image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/vehicles', filename);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found'
      });
    }
    
    // Eliminar el archivo
    fs.unlinkSync(filePath);
    
    return res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting image'
    });
  }
});

// Ruta para servir archivos estáticos (opcional, para desarrollo)
router.get('/uploads/vehicles/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads/vehicles', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Image not found' });
  }
});

export default router; 