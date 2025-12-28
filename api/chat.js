module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    const apiKey = process.env.MKEAI_API_KEY || 'sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX';

    const response = await fetch('https://tb.api.mkeai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',  // 试常见模型
        messages: [
          { role: 'system', content: '你是一个PDF内容助手，用自然中文回复。' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800
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
