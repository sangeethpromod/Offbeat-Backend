import express from 'express';
import {
  createFee,
  getAllFees,
  updateFee,
} from '../Controller/Fees/feeController';

// Note: This router is mounted at /api/fees in app.ts
const router = express.Router();

// POST /api/fees
router.post('/', createFee);

// GET /api/fees
router.get('/', getAllFees);

// PATCH /api/fees/:feeId
router.patch('/:feeId', updateFee);

export default router;
