const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { user_id, month, type } = event.queryStringParameters;

    if (!user_id || !month || !type) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing user_id, month, or type' })
        };
    }

    const apiUrl = `https://female-bias-wrap-merchandise.trycloudflare.com/api/report?user_id=${user_id}&month=${month}&type=${type}`;
    console.log(`Fetching report: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (!response.ok) {
            console.error(`API error: ${JSON.stringify(data)}`);
            return {
                statusCode: response.status,
                body: JSON.stringify(data)
            };
        }
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Error in getreport:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
