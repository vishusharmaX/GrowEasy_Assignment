const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

const PORT = env.PORT;

const startServer = async () => {
  // Connect to database (fails gracefully if DB is unavailable)
  await db.connectDB();

  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` GrowEasy CSV Importer Backend Running`);
    console.log(` Mode: ${env.NODE_ENV}`);
    console.log(` Port: ${PORT}`);
    console.log(` LLM Provider: ${env.LLM_PROVIDER}`);
    console.log(`=================================================`);
  });

  // Handle graceful shutdowns
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('Server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
