const { mongoose } = require('./connect');

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