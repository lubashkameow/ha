const fetch = require('node-fetch');

exports.handler = async (event) => {
  const apiUrl = 'https://probability-published-oxide-warcraft.trycloudflare.com/api/add_portfolio_photo';

  try {
    // Проверяем размер тела запроса (до 3 МБ)
    if (event.body.length > 3 * 1024 * 1024) {
      return {
        statusCode: 413,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Файл слишком большой' }),
      };
    }

    const { user_id, photo, description } = JSON.parse(event.body);

    if (!user_id || !photo) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing user_id or photo' }),
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, photo, description }),
    });

    const data = await response.json();

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error in add_portfolio_photo:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
