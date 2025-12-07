import { Router } from 'express';
import {
  createStory,
  updateStory,
  deleteStory,
  updateStoryPage2,
  updateStoryPage3,
  updateStoryImages,
  updateStoryItinerary,
  publishStory,
  adminApproveStory,
} from '../Controller/Story/HostLevel/StoryController';
import { getStoriesByUser } from '../Controller/Story/HostLevel/getStoryController';
import { getStoryDetailsForTraveller } from '../Controller/Story/TravellerLevel/getStoryDetails';
import upload from '../Utils/multerConfig';
import { verifyAccessToken } from '../Middleware/tokenManagement';

const storyRoutes = Router();

// Apply authentication middleware to all story routes below
storyRoutes.use(verifyAccessToken);

// STEP 1: POST /api/stories
storyRoutes.post('/create-story', createStory);

// STEP 2: PATCH /api/stories/:id/page2
storyRoutes.patch('/create-story/:id/page2', updateStoryPage2);

// STEP 3: PATCH /api/stories/:id/page3
storyRoutes.patch('/create-story/:id/page3', updateStoryPage3);

// STEP 4: PATCH /api/stories/:id/page4
storyRoutes.patch(
  '/create-story/:id/page4',
  upload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'storyImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 10 }, // Allow up to 10 other images
  ]),
  updateStoryImages
);

// STEP 5: PATCH /api/stories/:id/itinerary
storyRoutes.patch('/create-story/:id/page5', updateStoryItinerary);

// STEP 6: PATCH /api/stories/:id/publish
storyRoutes.patch('/create-story/:id/publish', publishStory);

// STEP 7: PATCH /api/stories/:id/approve
storyRoutes.patch('/create-story/:id/approve', adminApproveStory);

// GET /api/stories/my-stories - Get all stories created by the authenticated user
storyRoutes.get('/my-stories', getStoriesByUser);

// GET /api/stories/traveller/details/:storyId - Get comprehensive story details for travellers
storyRoutes.get('/traveller/details/:storyId', getStoryDetailsForTraveller);

// UPDATE: PUT /api/stories/:id - Update basic story information
storyRoutes.put('/update-story/:id', updateStory);

// DELETE: DELETE /api/stories/:id - Delete story and S3 images
storyRoutes.delete('/delete-story/:id', deleteStory);

export default storyRoutes;
