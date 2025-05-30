// Show Register Form
function showRegisterForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

// Show Login Form
function showLoginForm() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

// Register Form Submission
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('reg-password').value;

  console.log('Submitting registration data:', { username, firstName, lastName, email, password });

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, firstName, lastName, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    alert('Registration successful! Please sign in.');
    showLoginForm();
  } catch (error) {
    console.error('Registration error:', error.message);
    alert('Registration failed: ' + error.message);
  }
});

// Login Form Submission
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('username', username);
    window.location.href = '/linkedin.html';
  } catch (error) {
    console.error('Login error:', error.message);
    alert('Login failed: ' + error.message);
  }
});

// LinkedIn Form Submission (Visit LinkedIn URL and Show PDF Upload Section)
document.getElementById('linkedin-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('LinkedIn form submitted');

  const linkedInEmail = document.getElementById('linkedin-email').value;
  const linkedInPassword = document.getElementById('linkedin-password').value;
  const linkedInUrl = document.getElementById('linkedin-url').value;
  console.log('LinkedIn Email:', linkedInEmail);
  console.log('LinkedIn Password:', linkedInPassword);
  console.log('LinkedIn URL:', linkedInUrl);

  if (!linkedInUrl || !linkedInUrl.startsWith('https://www.linkedin.com/')) {
    alert('Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/your-profile)');
    return;
  }

  if (!linkedInEmail || !/\S+@\S+\.\S+/.test(linkedInEmail)) {
    alert('Please enter a valid LinkedIn email');
    return;
  }

  if (!linkedInPassword) {
    alert('Please enter your LinkedIn password');
    return;
  }

  const username = localStorage.getItem('username');
  if (!username) {
    alert('Error: Username not found. Please log in again.');
    window.location.href = '/index.html';
    return;
  }

  // Open LinkedIn URL
  const newWindow = window.open(linkedInUrl, '_blank');
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    console.log('Pop-up blocked or failed to open');
    alert('Unable to open the LinkedIn profile automatically. Please allow pop-ups for this site, or manually open the URL: ' + linkedInUrl);
  } else {
    console.log('LinkedIn URL opened successfully');
  }

  // Store LinkedIn email and URL in localStorage
  localStorage.setItem('linkedInEmail', linkedInEmail);
  localStorage.setItem('linkedInPassword', linkedInPassword);
  localStorage.setItem('linkedInUrl', linkedInUrl);

  // Hide LinkedIn form and show PDF upload section
  document.getElementById('linkedin-form').style.display = 'none';
  document.getElementById('upload-section').style.display = 'block';
});

// PDF Upload Form Submission
document.getElementById('pdf-upload-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('PDF upload form submitted');

  const username = localStorage.getItem('username');
  const linkedInEmail = localStorage.getItem('linkedInEmail');
  const linkedInUrl = localStorage.getItem('linkedInUrl');

  if (!username) {
    alert('Error: Username not found. Please log in again.');
    window.location.href = '/index.html';
    return;
  }
  if (!linkedInEmail || !linkedInUrl) {
    alert('Error: LinkedIn email or URL not found. Please submit the LinkedIn form again.');
    document.getElementById('linkedin-form').style.display = 'block';
    document.getElementById('upload-section').style.display = 'none';
    return;
  }

  const pdfFile = document.getElementById('linkedin-pdf').files[0];
  if (!pdfFile) {
    alert('Please select a PDF file to upload.');
    return;
  }

  const formData = new FormData();
  formData.append('username', username);
  formData.append('linkedInEmail', linkedInEmail);
  formData.append('linkedInUrl', linkedInUrl);
  formData.append('linkedinPdf', pdfFile);

  try {
    const response = await fetch('/api/upload-linkedin-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Non-JSON response from server:', text);
      throw new Error(`Server returned status ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('PDF uploaded and saved successfully:', data);

    // Hide upload section and show success message
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('save-message').style.display = 'block';
  } catch (error) {
    console.error('Error uploading PDF:', error.message);
    alert('Error uploading PDF: ' + error.message);
  }
});

// Function to navigate to the dashboard
function goToDashboard() {
  const username = localStorage.getItem('username');
  if (!username) {
    alert('Error: Username not found. Please log in again.');
    window.location.href = '/index.html';
    return;
  }
  window.location.href = `/dashboard.html?username=${username}`;
}

// Load Dashboard Data
async function loadDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');
  if (!username) {
    alert('Error: Username not found in URL. Please log in again.');
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('userUsername').textContent = username;

  try {
    const response = await fetch(`/api/dashboard/${username}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load dashboard data');
    }

    if (!data.profileData) {
      alert('No profile data available. Please upload your LinkedIn PDF.');
      return;
    }

    console.log('Dashboard data:', data);

    document.getElementById('userUsername').textContent = data.username || 'N/A';
    document.getElementById('userName').textContent = data.profileData.name || 'N/A';
    document.getElementById('userHeadline').textContent = data.profileData.headline || 'N/A';
    document.getElementById('userSummary').textContent = data.profileData.summary || 'N/A';
    document.getElementById('userExperience').textContent = data.profileData.experience?.join(', ') || 'N/A';
    document.getElementById('userSkills').textContent = data.profileData.skills?.join(', ') || 'N/A';

    // Optional: Add a link to download/view the PDF
    if (data.linkedInPdf) {
      const pdfDataUrl = `data:application/pdf;base64,${data.linkedInPdf}`;
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfDataUrl;
      pdfLink.textContent = 'View LinkedIn PDF';
      pdfLink.download = `${username}-linkedin-profile.pdf`;
      document.body.appendChild(pdfLink);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error.message);
    alert('Error loading dashboard data: ' + error.message);
  }
}

// Toggle Edit Mode
function toggleEdit() {
  const headlineInput = document.getElementById('headline');
  const summaryInput = document.getElementById('summary');
  const saveBtn = document.getElementById('save-btn');

  headlineInput.disabled = !headlineInput.disabled;
  summaryInput.disabled = !summaryInput.disabled;
  saveBtn.style.display = headlineInput.disabled ? 'none' : 'inline-block';
}

// Save Profile Changes
async function saveProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');
  if (!username) {
    alert('Error: Username not found in URL. Please log in again.');
    window.location.href = '/index.html';
    return;
  }

  const headline = document.getElementById('headline').value;
  const summary = document.getElementById('summary').value;

  try {
    const response = await fetch(`/api/update-profile/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline, summary }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    alert('Profile updated successfully!');
    toggleEdit();
  } catch (error) {
    console.error('Error updating profile:', error.message);
    alert('Failed to update profile: ' + error.message);
  }
}

// Optimize Profile
async function optimizeProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');
  if (!username) {
    alert('Error: Username not found in URL. Please log in again.');
    window.location.href = '/index.html';
    return;
  }

  try {
    const response = await fetch(`/api/optimize/${username}`, { method: 'POST' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to optimize profile');
    }

    document.getElementById('ats-score').textContent = data.atsScore || 'N/A';
    document.getElementById('opt-headline').textContent = data.generatedContent.headline || 'N/A';
    document.getElementById('opt-summary').textContent = data.generatedContent.summary || 'N/A';
    document.getElementById('resume').textContent = data.resume || 'N/A';
    document.getElementById('cover-letter').textContent = data.coverLetter || 'N/A';
  } catch (error) {
    console.error('Error optimizing profile:', error.message);
    alert('Error optimizing profile: ' + error.message);
  }
}

// Load dashboard on page load
if (window.location.pathname.includes('dashboard.html')) {
  loadDashboard();
}