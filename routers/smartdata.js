import express from 'express';
import { fetchSmartData } from '../controller/smartdata.js';
import { prescription } from '../middleware/multer.js';

const router = express.Router();

// Route for processing prescription images
router.post('/fetchsmartdata', prescription, fetchSmartData);

export default router; 