const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { nanoid } = require('nanoid');
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 5000;

// Proxy: Forward upload requests to original API
app.use(
  "/api/v1/uploadFile",
  createProxyMiddleware({
    target: "http://34.192.150.36",
    changeOrigin: true,
    pathRewrite: {
      "^/api/v1/uploadFile": "/api/v1/uploadFile"
    }
  })
);

// Proxy: Forward generate requests to original API
app.use(
  "/api/v1/generate",
  createProxyMiddleware({
    target: " https://tools.qrplus.ai/ ",
    changeOrigin: true,
    pathRewrite: {
      "^/api/v1/generate": "/api/v1/generate"
    }
  })
);

// CORS setup (supporting frontend on Vercel and local dev)
const allowedOrigins = [
  'https://algonomic-ai.vercel.app',
  'http://localhost:3000',
  'https://photo-editor-app-ecru.vercel.app'
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
