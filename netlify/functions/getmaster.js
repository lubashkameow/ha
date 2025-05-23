const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { date } = event.queryStringParameters; // Исправлено: извлекаем date
    
    if (!date) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'date parameter is required' })
        };
    }
    
    const url = `https://probability-published-oxide-warcraft.trycloudflare.com/api/master?date=${date}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
