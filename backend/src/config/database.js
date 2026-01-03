const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.NODE_ENV === 'test'
    ? process.env.MONGODB_TEST_URI
    : process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MongoDB URI not configured');
  }

  await mongoose.connect(uri);

  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

module.exports = { connectDB, disconnectDB };