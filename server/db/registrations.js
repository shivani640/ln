const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB with the 'linkedin_optimizer' database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_optimizer';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB (registrations.js) - Database: linkedin_optimizer'))
  .catch(err => {
    console.error('MongoDB connection error (registrations.js):', err.message);
    process.exit(1);
  });

// Registration Schema (for the 'registrations' collection)
const mongoose = require('mongoose');

// Registration Schema (for the 'registrations' collection)
const registrationSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }, // In a real app, password should be hashed
}, { collection: 'registrations' });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;