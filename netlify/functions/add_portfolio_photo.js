const fetch = require('node-fetch');

exports.handler = async (event) => {
    const apiUrl = `https://probability-published-oxide-warcraft.trycloudflare.com/api/add_portfolio_photo`;

    console.log('Запрос к /addportfolio:', event.body);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { /* Не устанавливаем Content-Type, так как FormData задаёт его автоматически */ },
            body: event.body
        });
        const data = await response.json();
        console.log('Ответ от сервера:', data);
        return {
            statusCode: response.ok ? 200 : response.status,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(data)
        };
    } catch (e) {
        console.error('Ошибка в addportfolio:', e);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message })
        };
    }
};
