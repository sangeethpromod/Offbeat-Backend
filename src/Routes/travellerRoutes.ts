import { Router } from 'express';
import {
  getTravellerProfile,
  updateTravellerProfile,
  changeTravellerPassword,
} from '../Controller/traveller/profileController';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const travellerRoutes = Router();

// Apply authentication middleware to all traveller routes
travellerRoutes.use(verifyAccessToken);

// GET /api/traveller/profile/get-profile-details/:userId - Get traveller profile details
travellerRoutes.get(
  '/profile/get-profile-details/:userId',
  getTravellerProfile
);

// PUT /api/traveller/profile/update-profile/:userId - Update traveller profile details
travellerRoutes.put('/profile/update-profile/:userId', updateTravellerProfile);

// PUT /api/traveller/profile/change-password/:userId - Change traveller password
travellerRoutes.put(
  '/profile/change-password/:userId',
  changeTravellerPassword
);

export default travellerRoutes;
