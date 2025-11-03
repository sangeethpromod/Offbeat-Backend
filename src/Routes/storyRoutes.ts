import { Router } from 'express';
import {
  createStory,
  updateStoryPage2,
  updateStoryPage3,
} from '../Controller/Story/StoryController';

const storyRoutes = Router();

// STEP 1: POST /api/stories
storyRoutes.post('/create-story', createStory);

// STEP 2: PATCH /api/stories/:id/page2
storyRoutes.patch('/create-story/:id/page2', updateStoryPage2);

// STEP 3: PATCH /api/stories/:id/page3
storyRoutes.patch('/create-story/:id/page3', updateStoryPage3);

export default storyRoutes;
