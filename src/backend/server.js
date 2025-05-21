const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT;

// Proxy: Forward upload requests to original API
app.use(
  "/api/v1/uploadFile",
  createProxyMiddleware({
    target: "https://34.192.150.36",
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
    target: "https://34.192.150.36",
    changeOrigin: true,
    pathRewrite: {
      "^/api/v1/generate": "/api/v1/generate"
    }
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
