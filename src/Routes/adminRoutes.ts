import { Router } from 'express';
import {
  getHostList,
  getHostDetails,
} from '../Controller/Admin/hostKPIController';
import {
  getTravellerList,
  getTravellerDetails,
} from '../Controller/Admin/travellerKPIController';
import { getStoryList } from '../Controller/Admin/storyKPIController';
import { getStoryDetails } from '../Controller/Admin/storyDetailsController';
import {
  blockTraveller,
  unblockTraveller,
} from '../Controller/Admin/travellerApprovalController';
import {
  approveHost,
  blockHost,
  unblockHost,
  rejectHost,
  deleteHost,
} from '../Controller/Admin/hostApprovalController';
import {
  blockStory,
  unblockStory,
  rejectStory,
} from '../Controller/Admin/storyApprovalController';
import {
  transactionTableData,
  transactionDetails,
} from '../Controller/Payment/paymentMetricController';

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

// Get detailed host information by userId
adminRoutes.get('/hosts/:userId', getHostDetails);

// Retrieves paginated traveller list with filters & sorting.
adminRoutes.post('/travellers', getTravellerList);

// Get detailed traveller information by userId
adminRoutes.get('/travellers/:userId', getTravellerDetails);

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

// Action: Delete a host (set isActive to false)
adminRoutes.patch('/hosts/delete', deleteHost);

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

// Get detailed story information by storyId
adminRoutes.get('/stories/:storyId', getStoryDetails);

// Action: Block a story + record reason
adminRoutes.patch('/stories/block', blockStory);

// Action: Unblock a story (returns to APPROVED)
adminRoutes.patch('/stories/unblock', unblockStory);

// Action: Reject a story + record reason
adminRoutes.patch('/stories/reject', rejectStory);

// -------------------------------------------------------
// 📖 Transaction MANAGEMENT
// -------------------------------------------------------

// POST /api/admin/transaction-table-data - Get paginated transaction table data for successful payments
adminRoutes.post('/transaction-table-data', transactionTableData);

// GET /api/admin/transaction-details/:razorpayOrderId - Get detailed transaction information by Razorpay Order ID
adminRoutes.get('/transaction-details/:razorpayOrderId', transactionDetails);

export default adminRoutes;
