const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { id_service } = event.queryStringParameters;
    
    if (!id_service) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'id_service parameter is required' }),
      };
    }

    // Запрашиваем календарь с основного сервера
    const calendarResponse = await fetch(
      `https://translations-raleigh-seekers-lo.trycloudflare.com/api/calendar?id_service=${id_service}`
    );
    
    if (!calendarResponse.ok) {
      throw new Error(`Failed to fetch calendar data: ${calendarResponse.statusText}`);
    }
    
    const calendarData = await calendarResponse.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(calendarData), // Просто передаем данные как есть
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};
