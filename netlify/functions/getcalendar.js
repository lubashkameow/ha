const fetch = require('node-fetch');

exports.handler = async (event) => {
    const duration = event.queryStringParameters.duration;
    const url = `https://kilometers-consult-massive-ix.trycloudflare.com/api/calendar?duration=${duration}`;
    
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