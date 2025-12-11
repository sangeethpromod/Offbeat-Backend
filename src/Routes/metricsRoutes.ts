import { Router } from 'express';
import {
  getRecentStories,
  getMostBookedStories,
} from '../Controller/MetricStories/homepageApi';

import { verifyAccessToken } from '../Middleware/tokenManagement';

const metricRoutes = Router();

metricRoutes.use(verifyAccessToken);
// GET /api/stories/recent - Get top 20 recently posted stories
metricRoutes.get('/recent', getRecentStories);

// GET /api/stories/most-booked - Get top 20 most booked stories
metricRoutes.get('/most-booked', getMostBookedStories);

export { metricRoutes };
