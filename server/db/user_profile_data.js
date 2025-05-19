const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB with the 'linkedin_optimizer' database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_optimizer';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB (user_profile_data.js) - Database: linkedin_optimizer'))
  .catch(err => {
    console.error('MongoDB connection error (user_profile_data.js):', err.message);
    process.exit(1);
  });

// User Profile Data Schema (for the 'user_profile_data' collection)
const mongoose = require('mongoose'); // Require mongoose directly
const { connectDB } = require('./connect');

// Ensure the database connection is established
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB in user_profile_data.js:', err.message);
  process.exit(1);
});

// User Profile Data Schema (for the 'user_profile_data' collection)
const mongoose = require('mongoose');
console.log('Mongoose in user_profile_data.js:', mongoose ? 'Defined' : 'Undefined');

// User Profile Data Schema (for the 'user_profile_data' collection)
const userProfileDataSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  profileData: {
    name: { type: String }, // Removed required: true for debugging
    headline: { type: String },
    summary: { type: String },
    experience: { type: [String] },
    skills: { type: [String] },
  },
  atsScore: Number,
  generatedContent: {
    headline: String,
    summary: String,
  },
  resume: String,
  coverLetter: String,
}, { collection: 'user_profile_data' });

const UserProfileData = mongoose.model('UserProfileData', userProfileDataSchema);

module.exports = UserProfileData;