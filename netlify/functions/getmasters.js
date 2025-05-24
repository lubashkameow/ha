const fetch = require('node-fetch');

exports.handler = async () => {
  try {
    const response = await fetch('https://female-bias-wrap-merchandise.trycloudflare.com/api/masters');
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
