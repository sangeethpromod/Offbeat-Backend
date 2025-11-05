import { Router } from 'express';
import {
  getAllLegal,
  getLegalById,
  createLegal,
  updateLegal,
  deleteLegal,
} from '../Controller/Legal/legalController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const legalRoutes = Router();

// Apply authentication middleware to all legal routes
legalRoutes.use(verifyAccessToken);

// GET /api/legal - Get all legal documents
legalRoutes.get('/all-legal', getAllLegal);

// GET /api/legal/:id - Get single legal document by legalId
legalRoutes.get('/single-legal/:id', getLegalById);

// POST /api/legal - Create new legal document
legalRoutes.post('/create-legal', createLegal);

// PUT /api/legal/:id - Update legal document
legalRoutes.put('/update-legal/:id', updateLegal);

// DELETE /api/legal/:id - Delete legal document
legalRoutes.delete('/delete-legal/:id', deleteLegal);

export default legalRoutes;
