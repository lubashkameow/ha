const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const { name, phone } = JSON.parse(event.body);

    if (!name || !phone) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing name or phone' })
        };
    }

    const apiUrl = 'https://concept-bedrooms-christopher-guide.trycloudflare.com/api/createclient'; 

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone })
        });

        const data = await response.json();

        return {
            statusCode: response.status,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

