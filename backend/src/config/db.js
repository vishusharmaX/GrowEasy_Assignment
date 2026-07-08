const mongoose = require('mongoose');
const env = require('./env');

let isDbConnected = false;

const connectDB = async () => {
  try {
    // Attempt connection with a short timeout to prevent blocking startup indefinitely
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isDbConnected = true;
    console.log('MongoDB connected successfully.');
  } catch (error) {
    isDbConnected = false;
    console.error('WARNING: MongoDB connection failed. Application will fall back to in-memory mode.', error.message);
  }
};

// Monitor connection issues
mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('WARNING: MongoDB disconnected. Application degraded to in-memory mode.');
});

mongoose.connection.on('connected', () => {
  isDbConnected = true;
  console.log('MongoDB reconnected.');
});

const getDbStatus = () => isDbConnected;

module.exports = {
  connectDB,
  getDbStatus,
};
