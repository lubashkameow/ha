const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const userId = event.queryStringParameters.user_id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user_id' }),
      };
    }

    const response = await fetch(
      `https://equity-connectivity-loops-entertainment.trycloudflare.com/api/appointments?user_id=${userId}`
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
