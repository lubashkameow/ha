const fetch = require('node-fetch');
const cheerio = require('cheerio'); // Добавьте в package.json: "cheerio": "^1.0.0-rc.12"

exports.handler = async () => {
  try {
    const response = await fetch('https://removal-essentially-jd-fu.trycloudflare.com/api/services');
    
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
