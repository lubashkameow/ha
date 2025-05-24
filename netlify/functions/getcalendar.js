const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    // Логируем входящие параметры
    console.log('Query parameters:', event.queryStringParameters);
    
    const { id_service } = event.queryStringParameters;
    
    if (!id_service) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Параметр id_service обязателен' }),
      };
    }

    // Добавляем проверку ID
    if (isNaN(id_service)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Некорректный ID услуги' }),
      };
    }

    const apiUrl = `https://revised-bios-collection-gather.trycloudflare.com/api/calendar?id_service=${id_service}`;
    console.log('Requesting:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Ошибка при запросе к API' }),
      };
    }
    
    const data = await response.json();
    
    // Проверяем структуру ответа
    if (!data.dates || !Array.isArray(data.dates)) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Некорректный формат данных от API' }),
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Internal error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Внутренняя ошибка сервера',
        details: error.message 
      }),
    };
  }
};
