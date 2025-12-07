import 'newrelic';

import dotenv from 'dotenv';

dotenv.config({ path: '.env.dev' });

import express from 'express';
import cors from 'cors';
import database from './Config/database';
import roleRoutes from './Routes/roleRoutes';
import authRoutes from './Routes/authRoute';
import hostRoutes from './Routes/hostRoutes';
import storyRoutes from './Routes/storyRoutes';
import feeRoutes from './Routes/feeRoute';
import legalRoutes from './Routes/legalRoutes';
import bookingRoutes from './Routes/booking';
import travellerRoutes from './Routes/travellerRoutes';
import adminRoutes from './Routes/adminRoutes';
import wishlistRoutes from './Routes/wishlistRoutes';
import { swaggerUi, specs } from './Config/swagger';

const app = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);

// Connect to MongoDB
database.connect();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/roles', roleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/traveller', travellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    swaggerOptions: {
      url: '/v2/api-docs',
    },
    customCss:
      '.swagger-ui .topbar { display: flex; justify-content: space-between; }',
    customJs: `
      document.addEventListener('DOMContentLoaded', function() {
        const topbar = document.querySelector('.topbar');
        const button = document.createElement('a');
        button.href = '/v2/api-docs';
        button.innerText = 'Export to Postman';
        button.download = 'swagger.json';
        button.style.color = 'white';
        button.style.marginLeft = '20px';
        button.style.textDecoration = 'none';
        topbar.appendChild(button);
      });
    `,
  })
);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  server.close(async () => {
    console.log('✅ HTTP server closed');
    await database.disconnect();
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Gracefully shutting down...');
  server.close(async () => {
    console.log('✅ HTTP server closed');
    await database.disconnect();
    process.exit(0);
  });
});

export default app;
