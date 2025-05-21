import fetch from 'node-fetch';
import { Buffer } from 'buffer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the content type boundary
    const contentType = req.headers['content-type'];
    
    console.log('Processing upload request, contentType:', contentType);
    
    // Convert req.body to buffer
    const response = await fetch('http://34.192.150.36/api/v1/uploadFile', {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Accept': 'application/json'
      },
      // Use the request body directly - Vercel will handle it
      body: req.body
    });
    
    // Process the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return res.status(response.status).send(errorText);
    }
    
    // Handle the JSON response
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Upload proxy error:', error);
    return res.status(500).json({
      error: 'Failed to process upload',
      message: error.message
    });
  }
} 