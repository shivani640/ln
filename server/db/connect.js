const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB with the 'linkedin_optimizer' database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_optimizer';

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 1) { // Only connect if not already connected
      await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to MongoDB - Database: linkedin_optimizer');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Export both the connection function and the mongoose instance
module.exports = { connectDB, mongoose };