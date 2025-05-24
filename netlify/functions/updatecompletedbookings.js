const fetch = require('node-fetch');

exports.handler = async () => {
    try {
        const response = await fetch(
            'https://revised-bios-collection-gather.trycloudflare.com/api/update_completed_bookings',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }
        );
        const result = await response.json();
        return {
            statusCode: response.status,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error in updatecompletedbookings:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
