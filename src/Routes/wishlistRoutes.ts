import { Router } from 'express';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from '../Controller/Wishlist/wishlistController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const wishlistRoutes = Router();

// Apply authentication middleware to all wishlist routes
wishlistRoutes.use(verifyAccessToken);

/**
 * Wishlist APIs (Traveller only)
 */

// POST /api/wishlist/add - Add a story to wishlist
wishlistRoutes.post('/add', addToWishlist);

// GET /api/wishlist - Get user's wishlist with story details
wishlistRoutes.get('/', getWishlist);

// DELETE /api/wishlist/remove - Remove a story from wishlist
wishlistRoutes.delete('/remove', removeFromWishlist);

export default wishlistRoutes;
