const mongoose = require('mongoose');

const userProfileDataSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  pdfText: { type: String }, // Store the raw extracted text
  linkedInPdf: { type: Buffer }, // Store PDF as binary data
  profileImage: { type: Buffer }, // Optional: Store profile image as binary data
});

module.exports = mongoose.model('UserProfileData', userProfileDataSchema);