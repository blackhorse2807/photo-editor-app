import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract parameters from the URL
    const { fileId, param } = req.query;
    
    console.log(`Processing generate request for fileId: ${fileId}, param: ${param}`);
    
    // Forward the request to the API server
    const response = await fetch(`http://34.192.150.36/api/v1/generate/${fileId}/${param}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return res.status(response.status).send(errorText);
    }
    
    // Parse and return the response
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Generate proxy error:', error);
    return res.status(500).json({
      error: 'Failed to process generate request',
      message: error.message
    });
  }
} 