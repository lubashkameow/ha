export default async () => {
  try {
    const response = await fetch('https://cheque-mature-wealth-habitat.trycloudflare.com/api/services');
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
