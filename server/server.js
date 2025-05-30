const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { connectDB } = require('./db/connect');
const Registration = require('./db/registrations');
const User = require('./db/users');
const UserProfileData = require('./db/user_profile_data');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Enable CORS
const cors = require('cors');
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// Set up Multer to use memory storage (no disk writes)
const upload = multer({ storage: multer.memoryStorage() }).single('linkedinPdf');

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});

// Register Route
app.post('/api/register', async (req, res) => {
  const { username, firstName, lastName, email, password } = req.body;
  console.log('Received registration data:', { username, firstName, lastName, email, password });

  if (!username || !firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await Registration.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const registration = new Registration({ username, firstName, lastName, email, password });
    await registration.save();
    console.log('User registered successfully in registrations collection:', registration);

    res.status(201).json({ message: 'Registration successful', username });
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Received login data:', { username, password });

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const registration = await Registration.findOne({ username });
    if (!registration) {
      return res.status(400).json({ error: 'User not found. Please register.' });
    }

    if (registration.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful', username });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// Upload LinkedIn PDF and Save Data
app.post('/api/upload-linkedin-pdf', (req, res) => {
  console.log('Received request to /api/upload-linkedin-pdf');

  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message, err.stack);
      return res.status(500).json({ error: 'File upload failed: ' + err.message });
    }

    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file uploaded');

    const { username, linkedInEmail, linkedInUrl } = req.body;

    if (!username || !linkedInEmail || !linkedInUrl || !req.file) {
      console.error('Missing required fields:', { username, linkedInEmail, linkedInUrl, file: !!req.file });
      return res.status(400).json({ error: 'Missing required fields (username, linkedInEmail, linkedInUrl, linkedinPdf)' });
    }

    try {
      // Verify user exists in registrations
      const registration = await Registration.findOne({ username });
      if (!registration) {
        console.log('User not found in registrations collection:', username);
        return res.status(404).json({ error: 'User not found. Please register or log in again.' });
      }

      // Save LinkedIn email and URL to users collection
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        await User.updateOne(
          { username },
          { $set: { linkedInEmail, linkedInUrl } }
        );
        console.log('LinkedIn data updated in users collection:', { username, linkedInEmail, linkedInUrl });
      } else {
        const user = new User({ username, linkedInEmail, linkedInUrl });
        await user.save();
        console.log('LinkedIn data saved in users collection:', user);
      }

      // Extract raw text from the PDF using pdf-parse
      let pdfText = '';
      try {
        const pdfBuffer = req.file.buffer;
        console.log('PDF buffer size:', pdfBuffer.length, 'bytes');

        // Attempt to extract text from the PDF
        const pdfData = await pdfParse(pdfBuffer, { max: 0 }); // max: 0 to extract all pages
        pdfText = pdfData.text || '';
        
        if (!pdfText.trim()) {
          console.warn('No text extracted from PDF. The PDF might be empty, contain only images, or be a scanned document.');
          pdfText = 'No text extracted from PDF. It may be a scanned document or contain only images.';
        } else {
          console.log('Extracted PDF text (first 500 characters):', pdfText.substring(0, 500));
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError.message, pdfError.stack);
        pdfText = 'Error extracting PDF text: ' + pdfError.message;
      }

      // Save PDF buffer and extracted text to user_profile_data collection
      const existingProfile = await UserProfileData.findOne({ username });
      if (existingProfile) {
        await UserProfileData.updateOne(
          { username },
          { $set: { 
            pdfText, // Store the raw extracted text
            linkedInPdf: req.file.buffer // Store the PDF as binary data
          } }
        );
        console.log('User profile updated in user_profile_data collection:', { username, pdfText: pdfText.substring(0, 500) });
      } else {
        const userProfile = new UserProfileData({ 
          username, 
          pdfText, // Store the raw extracted text
          linkedInPdf: req.file.buffer // Store the PDF as binary data
        });
        await userProfile.save();
        console.log('User profile created in user_profile_data collection:', { username, pdfText: pdfText.substring(0, 500) });
      }

      // Verify the data was saved correctly by querying the database
      const savedProfile = await UserProfileData.findOne({ username });
      if (savedProfile && savedProfile.pdfText) {
        console.log('Verified saved PDF text (first 500 characters):', savedProfile.pdfText.substring(0, 500));
      } else {
        console.error('Failed to verify saved PDF text in database:', savedProfile);
      }

      res.status(200).json({ message: 'PDF uploaded and saved successfully', pdfText });
    } catch (error) {
      console.error('Error uploading PDF:', error.message, error.stack);
      res.status(500).json({ error: 'Failed to upload PDF: ' + error.message });
    }
  });
});

// Get Dashboard Data
app.get('/api/dashboard/:username', async (req, res) => {
  try {
    console.log('Fetching dashboard data for username:', req.params.username);
    const userProfileData = await UserProfileData.findOne({ username: req.params.username });
    if (!userProfileData) {
      console.error('User profile data not found for username:', req.params.username);
      return res.status(404).json({ error: 'User profile data not found' });
    }
    console.log('Retrieved userProfileData (pdfText first 500 characters):', userProfileData.pdfText ? userProfileData.pdfText.substring(0, 500) : 'No pdfText');

    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      console.error('User not found in users collection for username:', req.params.username);
      return res.status(404).json({ error: 'User not found in users collection' });
    }
    console.log('Retrieved user from users collection:', JSON.stringify(user, null, 2));

    const combinedData = {
      username: userProfileData.username,
      pdfText: userProfileData.pdfText || 'No PDF content available',
      linkedInEmail: user.linkedInEmail,
      linkedInUrl: user.linkedInUrl,
      profileImage: userProfileData.profileImage ? userProfileData.profileImage.toString('base64') : null,
      linkedInPdf: userProfileData.linkedInPdf ? userProfileData.linkedInPdf.toString('base64') : null,
    };
    console.log('Sending dashboard data (pdfText first 500 characters):', combinedData.pdfText.substring(0, 500));
    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch dashboard data: ' + error.message });
  }
});

// Upload Profile Image
app.post('/api/upload-profile-image', upload, async (req, res) => {
  const { username } = req.body;
  if (!username || !req.file) {
    return res.status(400).json({ error: 'Username and image file are required' });
  }

  try {
    const imageBuffer = req.file.buffer;
    await UserProfileData.updateOne(
      { username },
      { $set: { profileImage: imageBuffer } }
    );
    res.status(200).json({ message: 'Image uploaded successfully', imagePath: 'Stored in database' });
  } catch (error) {
    console.error('Error uploading profile image:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  console.error(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Close MongoDB connection on process exit
process.on('SIGINT', async () => {
  console.log('MongoDB connection closed by connect.js');
  process.exit(0);
});