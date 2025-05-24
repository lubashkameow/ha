const fetch = require('node-fetch');

exports.handler = async (event) => {
  const apiUrl = 'https://female-bias-wrap-merchandise.trycloudflare.com/api/delete_portfolio_photo';

  try {
    const { user_id, photo_id } = JSON.parse(event.body);

    if (!user_id || !photo_id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing user_id or photo_id' }),
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, photo_id }),
    });

    const data = await response.json();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error in delete_portfolio_photo:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
