const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const response = await fetch('https://cad-specifies-slovakia-proof.trycloudflare.com/api/updatematerial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body
    });
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
