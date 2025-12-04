import { Router } from 'express';
import { getHostList } from '../Controller/Admin/hostKPIController';
import { getTravellerList } from '../Controller/Admin/travellerKPIController';
import { getStoryList } from '../Controller/Admin/storyKPIController';
import {
  blockTraveller,
  unblockTraveller,
} from '../Controller/Admin/travellerApprovalController';
import {
  approveHost,
  blockHost,
  unblockHost,
  rejectHost,
} from '../Controller/Admin/hostApprovalController';
import {
  blockStory,
  unblockStory,
} from '../Controller/Admin/storyApprovalController';
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
adminRoutes.post('/hosts', getHostList);

// Retrieves paginated traveller list with filters & sorting.
adminRoutes.post('/travellers', getTravellerList);

// Retrieves paginated story list with filters & sorting.
adminRoutes.post('/stories', getStoryList);

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

// Action: Reject a host + record reason (only from PENDING)
adminRoutes.patch('/hosts/reject', rejectHost);

// -------------------------------------------------------
//  TRAVELLER MANAGEMENT
// -------------------------------------------------------
// Routes for managing traveller accounts:
// Block → Unblock
// -------------------------------------------------------

// Action: Block a traveller + record reason
adminRoutes.patch('/travellers/block', blockTraveller);

// Action: Unblock a traveller
adminRoutes.patch('/travellers/unblock', unblockTraveller);

// -------------------------------------------------------
// 📖 STORY MANAGEMENT
// -------------------------------------------------------
// Routes for managing stories:
// Block → Unblock
// -------------------------------------------------------

// Action: Block a story + record reason
adminRoutes.patch('/stories/block', blockStory);

// Action: Unblock a story (returns to APPROVED)
adminRoutes.patch('/stories/unblock', unblockStory);

export default adminRoutes;
