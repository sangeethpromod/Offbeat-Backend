import dotenv from 'dotenv';

dotenv.config({ path: '.env.dev' });

import express from 'express';
import cors from 'cors';
import database from './Config/database';
import roleRoutes from './Routes/roleRoutes';
import { swaggerUi, specs } from './Config/swagger';

const app = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);

// Connect to MongoDB
database.connect();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/roles', roleRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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
