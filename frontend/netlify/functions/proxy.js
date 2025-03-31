const fetch = require('node-fetch');
const apiUrl = process.env.API_URL;

exports.handler = async (event) => {
    const { user_id } = event.queryStringParameters;
    if (!user_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Не указан user_id" })
        };
    }

    try {
        const apiUrl = process.env.API_URL || 'https://cheque-mature-wealth-habitat.trycloudflare.com/api/services';
        const response = await fetch(`${apiUrl}/api/appointments?user_id=${user_id}`);
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Ошибка сервера",
                details: error.message 
            })
        };
    }
};
