const { getSession } = require('./session-store');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  const { message, sessionId } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    const apiKey = 'sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX';
    const baseUrl = 'https://tb.api.mkeai.com';

    // 获取会话上下文
    let systemPrompt = '你是一个PDF内容助手，用自然中文回复。';
    if (sessionId) {
      const session = getSession(sessionId);
      if (session && session.pdfText) {
        const pdfPreview = session.pdfText.substring(0, 3000);
        systemPrompt = `你是一个PDF内容助手，基于以下PDF内容回答用户问题。\n\nPDF内容片段：\n${pdfPreview}\n\n请根据以上内容回答用户的问题。`;
      }
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API错误 ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content?.trim() || '无回复';

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message || '调用失败' });
  }
};