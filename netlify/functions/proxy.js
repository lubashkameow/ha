const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { user_id } = event.queryStringParameters || {};
  
  if (!user_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "User ID is required" })
    };
  }

  try {
    const apiUrl = `https://kilometers-consult-massive-ix.trycloudflare.com/api/appointments?user_id=${user_id}`;
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
        error: 'Failed to fetch appointments',
        details: error.message
      })
    };
  }
};
