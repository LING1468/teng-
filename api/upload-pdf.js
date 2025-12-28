const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    // 读取文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 20000);

    if (!text.trim()) {
      return res.status(400).json({ error: 'PDF 无文本内容' });
    }

    // 使用该代理支持的稳定模型
    const response = await fetch('https://tb.api.mkeai.com/v1/chat/completions', {
      method: 'POST',
     headers: {
    'Content-Type': 'application/json',
    ...(apiKey && { 'Authorization': `Bearer ${sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX}` })  // 自动添加Key
  },
      body: JSON.stringify({
        model: 'deepseek-chat',  // ← 关键：换成这个模型，立即成功！
        messages: [
          { role: 'system', content: '你是一个专业的PDF总结助手，用简洁自然的中文回复。' },
          { role: 'user', content: `请总结以下PDF内容（400字以内）：\n${text}` }
        ],
        temperature: 0.6,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`API错误 ${response.status}: ${JSON.stringify(err)}`);
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

