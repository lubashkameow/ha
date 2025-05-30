const fetch = require('node-fetch');

exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    const url = `https://leon-dec-becomes-result.trycloudflare.com/api/bookings`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) throw new Error('Booking failed');
        
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
