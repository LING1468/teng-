const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    const apiKey = process.env.MKEAI_API_KEY || 'sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX';  // 

    // 读取文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    // 解析 PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 20000);

    if (!text.trim()) {
      return res.status(400).json({ error: 'PDF 无文本内容' });
    }

    // 直接 POST 请求您提供的 API
    const response = await fetch('https://tb.api.mkeai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })  // 如果需要 Key
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',  // 常见默认模型，或试 'deepseek-chat' / 'qwen' 等
        messages: [
          { role: 'system', content: '你是一个专业的PDF总结助手，用简洁自然的中文回复。' },
          { role: 'user', content: `请总结以下PDF内容（300字以内）：\n${text}` }
        ],
        temperature: 0.6,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API错误 ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim() || '总结失败';

    res.status(200).json({ summary, success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || '调用失败' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb'
  }
};
