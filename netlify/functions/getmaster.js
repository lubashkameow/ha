const fetch = require('node-fetch');

exports.handler = async (event) => {
    const id = event.queryStringParameters.id;
    const url = `https://lab-review-nurses-shape.trycloudflare.com/api/master?id=${id}`;
    
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
