const { mongoose } = require('./connect');

// User Schema (for the 'users' collection)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  linkedInEmail: { type: String, required: true },
  linkedInUrl: { type: String, required: true },
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

module.exports = User;