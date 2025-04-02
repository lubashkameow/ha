const fetch = require('node-fetch');

exports.handler = async () => {
  const API_URL = 'https://arabia-refurbished-palm-accepting.trycloudflare.com.com/api/services';
  
  try {
    console.log('Отправка запроса к:', API_URL);
    const response = await fetch(API_URL, {
      timeout: 5000 // 5 секунд таймаут
    });

    console.log('Получен ответ, статус:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка ответа:', errorText);
      throw new Error(`API вернул статус ${response.status}`);
    }

    const data = await response.json();
    console.log('Успешно получены данные');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Полная ошибка:', error);
    return {
      statusCode: 200, // Возвращаем 200, но с сообщением об ошибке
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: true,
        message: "Сервис временно недоступен",
        debug: process.env.NODE_ENV === 'development' ? error.message : null
      })
    };
  }
};
