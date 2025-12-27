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
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.sk-fcd93f7691d24d7ca8d8e1908214179a}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个PDF内容专家，用自然中文回复。' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0]?.message?.content?.trim() || '无回复';

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'AI调用失败' });
  }
};
