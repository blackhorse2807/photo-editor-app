// Create a proxy handler that will forward requests to the API server
export default async function handler(req, res) {
  try {
    // Parse the URL and determine target
    const { pathname, search } = new URL(req.url, `https://${req.headers.host}`);
    const targetPath = pathname.replace(/^\/api/, '');
    const targetUrl = `http://34.192.150.36/api${targetPath}${search || ''}`;
    
    console.log(`Proxying request from ${pathname} to ${targetUrl}`);
    
    // Build the fetch options based on the incoming request
    const options = {
      method: req.method,
      headers: {}
    };
    
    // Copy relevant headers from the original request
    if (req.headers['content-type']) {
      options.headers['Content-Type'] = req.headers['content-type'];
    }
    if (req.headers['accept']) {
      options.headers['Accept'] = req.headers['accept'];
    }
    
    // Handle request body for POST, PUT, etc.
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.body) {
        if (typeof req.body === 'string') {
          options.body = req.body;
        } else {
          options.body = JSON.stringify(req.body);
        }
      } else {
        // If req.body isn't available, try to read it
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        options.body = Buffer.concat(chunks).toString();
      }
    }
    
    // Make the request to the target server
    const response = await fetch(targetUrl, options);
    
    // Prepare the response
    const contentType = response.headers.get('content-type');
    
    // Set headers on the response
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    // Set status code
    res.status(response.status);
    
    // Handle the response based on content-type
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to proxy request',
      message: error.message
    });
  }
} 