const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Enable CORS to handle cross-origin requests (if frontend and backend are on different ports)
const cors = require('cors');
app.use(cors({
  origin: '*', // Adjust this in production to specific origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// MongoDB connection setup using the native driver
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_optimizer';
let client;
let db;

const connectDB = async () => {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('linkedin_optimizer');
    console.log('Connected to MongoDB using native driver - Database: linkedin_optimizer');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

// Connect to MongoDB before starting the server
connectDB()
  .then(() => {
    console.log('Database connection established. Starting server...');
  })
  .catch(err => {
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
    const registrations = db.collection('registrations');
    const existingUser = await registrations.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const registration = { username, firstName, lastName, email, password };
    await registrations.insertOne(registration);
    console.log('User registered successfully in registrations collection:', registration);
    const savedRegistration = await registrations.findOne({ username });
    console.log('Queried registrations collection after save:', savedRegistration);

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
    const registrations = db.collection('registrations');
    const registration = await registrations.findOne({ username });
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

// Save LinkedIn Email/URL (in 'users' collection) and Profile Data (in 'user_profile_data' collection)
app.post('/api/save-profile', async (req, res) => {
  const { username, linkedInEmail, linkedInUrl, profileData } = req.body;
  console.log('Received data to save:', { username, linkedInEmail, linkedInUrl, profileData });

  if (!username || !linkedInEmail || !linkedInUrl || !profileData) {
    return res.status(400).json({ error: 'Missing required fields (username, linkedInEmail, linkedInUrl, profileData)' });
  }

  if (!profileData.name || !profileData.headline || !profileData.summary || !profileData.experience || !profileData.skills) {
    return res.status(400).json({ error: 'All profileData fields are required (name, headline, summary, experience, skills)' });
  }

  try {
    const registrations = db.collection('registrations');
    const registration = await registrations.findOne({ username });
    if (!registration) {
      console.log('User not found in registrations collection:', username);
      return res.status(404).json({ error: 'User not found. Please register or log in again.' });
    }

    const users = db.collection('users');
    const existingUser = await users.findOne({ username });
    if (existingUser) {
      await users.updateOne(
        { username },
        { $set: { linkedInEmail, linkedInUrl } }
      );
      console.log('LinkedIn data updated in users collection:', { username, linkedInEmail, linkedInUrl });
    } else {
      const user = { username, linkedInEmail, linkedInUrl };
      await users.insertOne(user);
      console.log('LinkedIn data saved in users collection:', user);
    }

    const userProfileDataCollection = db.collection('user_profile_data');
    const existingProfile = await userProfileDataCollection.findOne({ username });
    if (existingProfile) {
      await userProfileDataCollection.updateOne(
        { username },
        { $set: { 
          profileData: {
            name: profileData.name,
            headline: profileData.headline,
            summary: profileData.summary,
            experience: profileData.experience,
            skills: profileData.skills
          }
        } }
      );
      console.log('User profile updated in user_profile_data collection:', { username, profileData });
    } else {
      const userProfile = { 
        username, 
        profileData: {
          name: profileData.name,
          headline: profileData.headline,
          summary: profileData.summary,
          experience: profileData.experience,
          skills: profileData.skills
        }
      };
      await userProfileDataCollection.insertOne(userProfile);
      console.log('User profile created in user_profile_data collection:', userProfile);
    }

    res.status(200).json({ message: 'Saved successfully', profileData });
  } catch (error) {
    console.error('Error saving profile data:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to save profile data: ' + error.message });
  }
});

// Get Dashboard Data
app.get('/api/dashboard/:username', async (req, res) => {
  try {
    console.log('Fetching dashboard data for username:', req.params.username);
    const userProfileDataCollection = db.collection('user_profile_data');
    const userProfileData = await userProfileDataCollection.findOne({ username: req.params.username });
    if (!userProfileData) {
      console.error('User profile data not found for username:', req.params.username);
      return res.status(404).json({ error: 'User profile data not found' });
    }
    console.log('Retrieved userProfileData:', JSON.stringify(userProfileData, null, 2));

    const users = db.collection('users');
    const user = await users.findOne({ username: req.params.username });
    if (!user) {
      console.error('User not found in users collection for username:', req.params.username);
      return res.status(404).json({ error: 'User not found in users collection' });
    }
    console.log('Retrieved user from users collection:', JSON.stringify(user, null, 2));

    const combinedData = {
      username: userProfileData.username,
      profileData: userProfileData.profileData || {},
      linkedInEmail: user.linkedInEmail,
      linkedInUrl: user.linkedInUrl,
      profileImage: userProfileData.profileImage || null,
    };
    console.log('Sending dashboard data:', JSON.stringify(combinedData, null, 2));
    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch dashboard data: ' + error.message });
  }
});

// Update Profile Data (Allow Modification)
app.post('/api/update-profile/:username', async (req, res) => {
  const { headline, summary } = req.body;
  try {
    const userProfileDataCollection = db.collection('user_profile_data');
    const userProfileData = await userProfileDataCollection.findOne({ username: req.params.username });
    if (!userProfileData) {
      return res.status(404).json({ error: 'User profile data not found' });
    }

    const updatedProfileData = {
      ...userProfileData.profileData,
      headline: headline || userProfileData.profileData.headline,
      summary: summary || userProfileData.profileData.summary,
    };

    await userProfileDataCollection.updateOne(
      { username: req.params.username },
      { $set: { profileData: updatedProfileData } }
    );

    const updatedProfile = await userProfileDataCollection.findOne({ username: req.params.username });
    res.status(200).json({ message: 'Profile updated successfully', profileData: updatedProfile.profileData });
  } catch (error) {
    console.error('Error updating profile data:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update profile data: ' + error.message });
  }
});

// Upload Profile Image
app.post('/api/upload-profile-image', upload.single('profileImage'), async (req, res) => {
  const { username } = req.body;
  if (!username || !req.file) {
    return res.status(400).json({ error: 'Username and image file are required' });
  }

  try {
    const imagePath = `/uploads/${req.file.filename}`;
    const userProfileDataCollection = db.collection('user_profile_data');
    await userProfileDataCollection.updateOne(
      { username },
      { $set: { profileImage: imagePath } }
    );
    res.status(200).json({ message: 'Image uploaded successfully', imagePath });
  } catch (error) {
    console.error('Error uploading profile image:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Close MongoDB connection on process exit
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});