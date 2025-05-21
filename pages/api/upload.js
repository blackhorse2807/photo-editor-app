import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(500).json({ error: 'Failed to parse form data' });
      }

      // Create a new form to forward to the API
      const formData = new FormData();
      
      // Add any file in the request
      if (files.file) {
        const fileData = fs.readFileSync(files.file.filepath);
        formData.append('file', fileData, {
          filename: files.file.originalFilename || 'image.jpg',
          contentType: files.file.mimetype || 'image/jpeg',
        });
      }
      
      // Add any other fields
      Object.keys(fields).forEach(key => {
        formData.append(key, fields[key]);
      });
      
      try {
        // Forward the request to the original API
        const response = await fetch('http://34.192.150.36/api/v1/uploadFile', {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
        });
        
        // Handle the API response
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          return res.status(response.status).send(errorText);
        }
        
        const data = await response.json();
        return res.status(200).json(data);
      } catch (error) {
        console.error('API request error:', error);
        return res.status(500).json({ error: 'Failed to forward request to API' });
      }
    });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
} 