import express from 'express';
import { createFee, getAllFees } from '../Controller/Fees/feeController';

// Note: This router is mounted at /api/fees in app.ts
const router = express.Router();

// POST /api/fees
router.post('/', createFee);

// GET /api/fees
router.get('/', getAllFees);

export default router;
