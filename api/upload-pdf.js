const pdfParse = require('pdf-parse');
const { setSession } = require('./session-store');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    const apiKey = 'sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX';
    const baseUrl = 'https://tb.api.mkeai.com';

    // 读取文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 20000);

    if (!text.trim()) {
      return res.status(400).json({ error: 'PDF 无文本内容' });
    }

    // 调用 API
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })  // 只有Key存在时才添加
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的PDF总结助手，用简洁自然的中文回复。' },
          { role: 'user', content: `请总结以下PDF内容（400字以内）：\n${text}` }
        ],
        temperature: 0.6,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`API错误 ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    // 处理不同的响应格式
    let summary = '总结失败';
    const content = data.choices?.[0]?.message?.content;

    if (content && content.trim()) {
      summary = content.trim();
    } else if (data.reasoning_content) {
      // 如果 content 为空但有 reasoning_content，使用它
      summary = '生成中，请稍后再试...';
    } else if (data.content) {
      summary = data.content;
    } else if (data.reply) {
      summary = data.reply;
    } else if (data.message) {
      summary = data.message;
    }

    // 生成 sessionId 并存储会话
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setSession(sessionId, { pdfText: text, fileName: req.headers['x-file-name'] || 'unknown.pdf' });

    res.status(200).json({ sessionId, summary, success: true });
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