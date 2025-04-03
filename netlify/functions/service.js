const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { id } = event.queryStringParameters;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'id parameter is required' }),
      };
    }

    const response = await fetch(`https://translations-raleigh-seekers-lo.trycloudflare.com/api/service?id=${id}`);
    
    if (!response.ok) throw new Error('Failed to fetch service details');
    
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
