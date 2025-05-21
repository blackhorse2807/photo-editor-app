const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const https = require('https');
const axios = require('axios');
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 5000;

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // WARNING: This allows insecure SSL connections - only use for development
});

// Add direct API endpoints to bypass certificate issues
app.post('/backend/api/v1/uploadFile', async (req, res) => {
  try {
    console.log('Proxying uploadFile request to API');
    
    // Forward the request to the API with certificate validation disabled
    const response = await axios({
      method: 'post',
      url: 'https://34.192.150.36/api/v1/uploadFile',
      data: req.body,
      headers: req.headers,
      httpsAgent // Using the agent that ignores certificate validation
    });
    
    // Send the API response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying to API:', error.message);
    if (error.response) {
      // Forward API error response
      res.status(error.response.status).json(error.response.data);
    } else {
      // Network or other error
      res.status(500).json({ error: 'Failed to connect to API server', details: error.message });
    }
  }
});

app.get('/backend/api/v1/generate/:fileId/:param', async (req, res) => {
  try {
    console.log(`Proxying generate request for file ${req.params.fileId}`);
    
    // Forward the request to the API with certificate validation disabled
    const response = await axios({
      method: 'get',
      url: `https://34.192.150.36/api/v1/generate/${req.params.fileId}/${req.params.param}`,
      headers: req.headers,
      httpsAgent // Using the agent that ignores certificate validation
    });
    
    // Send the API response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying to API:', error.message);
    if (error.response) {
      // Forward API error response
      res.status(error.response.status).json(error.response.data);
    } else {
      // Network or other error
      res.status(500).json({ error: 'Failed to connect to API server', details: error.message });
    }
  }
});

// Keep the existing proxy middleware as backup
app.use(
  "/api/v1/uploadFile",
  createProxyMiddleware({
    target: "https://34.192.150.36",
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      "^/api/v1/uploadFile": "/api/v1/uploadFile"
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy error: ' + err.message);
    },
    logLevel: 'debug' // Set to 'info' in production
  })
);

// Keep the existing proxy middleware as backup
app.use(
  "/api/v1/generate",
  createProxyMiddleware({
    target: "https://34.192.150.36",
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      "^/api/v1/generate": "/api/v1/generate"
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy error: ' + err.message);
    },
    logLevel: 'debug' // Set to 'info' in production
  })
);

// CORS setup (supporting frontend on Vercel and local dev)
const allowedOrigins = [
  'https://algonomic-ai.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple root check
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// User helpers
function readUsers() {
  if (!fs.existsSync('users.json')) fs.writeFileSync('users.json', '[]');
  return JSON.parse(fs.readFileSync('users.json', 'utf8'));
}
function writeUsers(users) {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Signup route
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed });
  writeUsers(users);
  res.json({ success: true });
});

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });
  res.json({ token });
});

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, 'your_secret_key');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Protected example route
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Something broke!', details: err.message });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Visit http://localhost:${port} to check if server is running`);
});
