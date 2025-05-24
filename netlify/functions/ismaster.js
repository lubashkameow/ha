const fetch = require('node-fetch');

exports.handler = async (event) => {
  const userId = event.queryStringParameters?.user_id;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'user_id required' }),
    };
  }

  try {
    const response = await fetch(`https://female-bias-wrap-merchandise.trycloudflare.com/api/is_master?user_id=${userId}`);
    
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
