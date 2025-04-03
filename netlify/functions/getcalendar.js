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

    // Получаем информацию о услуге, включая duration_minutes
    const serviceResponse = await fetch(`https://translations-raleigh-seekers-lo.trycloudflare.com/api/service?id=${id_service}`);
    
    if (!serviceResponse.ok) throw new Error('Failed to fetch service details');
    
    const serviceData = await serviceResponse.json();
    const duration = serviceData.duration_minutes || 60;

    // Получаем календарь с учетом длительности услуги
    const calendarResponse = await fetch(`https://translations-raleigh-seekers-lo.trycloudflare.com/api/calendar?duration=${duration}`);
    
    if (!calendarResponse.ok) throw new Error('Failed to fetch calendar data');
    
    const calendarData = await calendarResponse.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        dates: calendarData.dates,
        service: {
          id: id_service,
          duration: duration
        }
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
