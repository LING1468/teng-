const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: 'sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX' });
    }

    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 20000);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的PDF总结助手，用简洁自然的中文回复。' },
          { role: 'user', content: `请总结以下PDF内容（300字以内）：\n${text}` }
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim() || '总结失败';

    res.status(200).json({ summary, success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || '服务器错误' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb'
  }
};

