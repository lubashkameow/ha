const fetch = require('node-fetch');

exports.handler = async (event) => {
  const apiUrl = 'https://cad-specifies-slovakia-proof.trycloudflare.com/api/update_portfolio_description';

  try {
    const { user_id, photo_id, description } = JSON.parse(event.body);

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
      body: JSON.stringify({ user_id, photo_id, description }),
    });

    const data = await response.json();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error in update_portfolio_description:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
