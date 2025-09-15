import express from 'express';
import { authenticateToken } from '../middleware/auth';
import thingiverseService from '../services/thingiverseService';

const router = express.Router();

// Search Thingiverse models
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, perPage = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await thingiverseService.searchModels(
      q as string,
      Number(page),
      Number(perPage)
    );

    res.json(results);
  } catch (error) {
    console.error('Error searching Thingiverse:', error);
    res.status(500).json({ error: 'Failed to search Thingiverse models' });
  }
});

// Get popular models
router.get('/popular', async (req, res) => {
  try {
    const { category, page = 1, perPage = 20 } = req.query;

    const results = await thingiverseService.getPopularModels(
      category as string,
      Number(page),
      Number(perPage)
    );

    res.json(results);
  } catch (error) {
    console.error('Error fetching popular models:', error);
    res.status(500).json({ error: 'Failed to fetch popular models' });
  }
});

// Get model details
router.get('/model/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const model = await thingiverseService.getModelDetails(id);

    res.json(model);
  } catch (error) {
    console.error('Error fetching model details:', error);
    res.status(500).json({ error: 'Failed to fetch model details' });
  }
});

// Import model from Thingiverse
router.post('/import/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedFileIndex = 0 } = req.body;
    const userId = (req as any).user.id;

    const result = await thingiverseService.importModelFromThingiverse(
      id,
      userId,
      selectedFileIndex
    );

    res.json(result);
  } catch (error) {
    console.error('Error importing model:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to import model' 
    });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await thingiverseService.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
