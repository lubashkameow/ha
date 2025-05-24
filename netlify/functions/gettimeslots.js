const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { date, master_id, service_id } = event.queryStringParameters;
    
    if (!date || !master_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'date, master_id, and service_id parameters are required' })
        };
    }
    
    const url = `https://female-bias-wrap-merchandise.trycloudflare.com/api/timeslots?date=${date}&master_id=${master_id}&service_id=${service_id}`;
    
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
