import { Router } from 'express';
import { getHostList } from '../Controller/Admin/hostKPIController';
import {
  approveHost,
  blockHost,
  unblockHost,
} from '../Controller/Admin/approvalController';
import { verifyAccessToken } from '../Middleware/tokenManagement';
import { requireAdmin } from '../Middleware/roleAuth';

const adminRoutes = Router();

// -------------------------------------------------------
// 🔐 GLOBAL MIDDLEWARE — SECURITY FIRST
// -------------------------------------------------------
// All admin routes require:
// 1. Valid Access Token
// 2. Admin Role
adminRoutes.use(verifyAccessToken, requireAdmin);

// -------------------------------------------------------
// 📊 HOST LISTING & KPI ROUTES
// -----------------------------------------------------


// Retrieves paginated host list with filters & sorting.
// -------------------------------------------------------
adminRoutes.post('/hosts', getHostList);

// -------------------------------------------------------
// ✅ HOST APPROVAL WORKFLOW
// -------------------------------------------------------
// Routes that manipulate host state:
// Approve → Block → Unblock
// Designed for admin decision flow.
// -------------------------------------------------------

// Action: Mark host as APPROVED (from PENDING)
adminRoutes.patch('/hosts/approve', approveHost);

// Action: Block a host + record reason
adminRoutes.patch('/hosts/block', blockHost);

// Action: Move host from BLOCKED → PENDING
adminRoutes.patch('/hosts/unblock', unblockHost);

export default adminRoutes;
