const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { booking_id } = JSON.parse(event.body);

    if (!booking_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing booking_id' }),
      };
    }

    const response = await fetch('https://plastic-reproduction-resorts-barbara.trycloudflare.com/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id }),
    });

    if (!response.ok) throw new Error('API request failed');

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
