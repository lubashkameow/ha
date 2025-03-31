const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const response = await fetch('https://cheque-mature-wealth-habitat.trycloudflare.com/api/services');
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
