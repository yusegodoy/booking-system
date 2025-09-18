import express from 'express';
import Area from '../models/Area';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const areas = await Area.find();
    return res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const area = new Area(req.body);
    await area.save();
    return res.json(area);
  } catch (error) {
    console.error('Error creating area:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    return res.json(area);
  } catch (error) {
    console.error('Error updating area:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting area:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 