const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { user_id, date } = event.queryStringParameters;
    const apiUrl = `https://female-bias-wrap-merchandise.trycloudflare.com/api/app?user_id=${user_id}&date=${date}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message })
        };
    }
};
