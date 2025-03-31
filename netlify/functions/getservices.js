// Новый правильный формат для Netlify Functions
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    const apiUrl = 'https://cheque-mature-wealth-habitat.trycloudflare.com/api/services';
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch services',
        details: error.message
      })
    };
  }
};
