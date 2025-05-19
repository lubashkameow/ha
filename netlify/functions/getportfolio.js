const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const masterId = event.queryStringParameters.master_id;
    if (!masterId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing master_id' }),
      };
    }

    const response = await fetch(
      `https://want-nursing-period-noise.trycloudflare.com/api/portfolio?master_id=${masterId}`
    );

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
