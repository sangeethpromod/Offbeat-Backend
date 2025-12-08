import express from 'express';
import {
  createFee,
  getAllFees,
  updateFee,
  getFeeById,
  deleteFee,
} from '../Controller/Fees/feeController';

// Note: This router is mounted at /api/fees in app.ts
const router = express.Router();

// POST /api/fees
router.post('/', createFee);

// GET /api/fees
router.get('/get-all-fees', getAllFees);

// GET /api/fees/:feeId
router.get('/:feeId', getFeeById);

// DELETE /api/fees/:feeId
router.delete('/:feeId', deleteFee);

// PATCH /api/fees/update/:feeId
router.patch('/update/:feeId', updateFee);

export default router;
