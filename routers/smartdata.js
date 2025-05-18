import express from 'express';
import { fetchSmartData } from '../controller/smartdata.js';
import { prescription } from '../middleware/multer.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Route for processing prescription images
router.post('/fetchsmartdata', isAuthenticated, prescription, fetchSmartData);

export default router; 