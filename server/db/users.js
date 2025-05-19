const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB with the 'linkedin_optimizer' database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_optimizer';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB (users.js) - Database: linkedin_optimizer'))
  .catch(err => {
    console.error('MongoDB connection error (users.js):', err.message);
    process.exit(1);
  });

// User Schema (for the 'users' collection)
const mongoose = require('mongoose'); // Require mongoose directly
const { connectDB } = require('./connect');

// Ensure the database connection is established
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB in users.js:', err.message);
  process.exit(1);
});

// User Schema (for the 'users' collection)
const mongoose = require('mongoose');

// User Schema (for the 'users' collection)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  linkedInEmail: { type: String, required: true },
  linkedInUrl: { type: String, required: true },
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

module.exports = User;