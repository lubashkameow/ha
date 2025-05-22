const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { user_id, month, type } = event.queryStringParameters;

    const apiUrl = `https://monkey-bandwidth-suggesting-murray.trycloudflare.com/api/report?user_id=${user_id}&month=${month}&type=${type}`;

    try {
        const response = await fetch(apiUrl);
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
