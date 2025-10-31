import express from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from '../Controller/Auth/roleController';

const router = express.Router();

// POST /api/roles - Create a new role
router.post('/create-role', createRole);

// GET /api/roles - Get all roles
router.get('/get-all-roles', getAllRoles);

// GET /api/roles/:id - Get role by ID
router.get('/get-role/:id', getRoleById);

// PUT /api/roles/:id - Update role by ID
router.put('/update-role/:id', updateRole);

export default router;
