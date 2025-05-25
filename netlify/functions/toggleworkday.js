const fetch = require('node-fetch');

exports.handler = async (event) => {
    const apiUrl = `https://biotechnology-les-nu-cleaning.trycloudflare.com/api/toggleworkday`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body
        });
        const data = await response.json();
        return {
            statusCode: response.ok ? 200 : response.status,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(data)
        };
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message })
        };
    }
};
