import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import database from './Config/database';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);

// Connect to MongoDB
database.connect();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
