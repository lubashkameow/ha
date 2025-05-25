const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { user_id, month } = event.queryStringParameters;
    const apiUrl = `https://biotechnology-les-nu-cleaning.trycloudflare.com/api/getcalendardata?user_id=${user_id}&month=${month}`;

    try {
        const response = await fetch(apiUrl);
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
