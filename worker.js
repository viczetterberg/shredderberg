export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const body = await request.json();

    // Build message content based on whether it's a photo or text query
    let content;
    if (body.image) {
      content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: body.media_type || 'image/jpeg',
            data: body.image,
          },
        },
        {
          type: 'text',
          text: 'Identify the food in this image. Estimate the visible portion size and provide realistic calorie and macro estimates. Be specific with the calorie count — never use 0 or placeholder values. Respond with ONLY a single JSON object, no other text: {"name":"food name","calories":450,"protein":30,"carbs":40,"fat":15}',
        },
      ];
    } else if (body.text) {
      content = [
        {
          type: 'text',
          text: `The user ate: "${body.text}". Estimate realistic calories and macronutrients for a typical serving. Be specific — never use 0 or placeholder values. Respond with ONLY a single JSON object, no other text: {"name":"food name","calories":450,"protein":30,"carbs":40,"fat":15}`,
        },
      ];
    } else {
      return new Response(JSON.stringify({ error: 'Missing image or text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          { role: 'user', content },
        ],
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
