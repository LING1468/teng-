const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST' });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY 未设置' });
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'llama-3.1-70b-versatile',
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '无回复';
    res.status(200).json({ reply });
  } catch (error) {
    console.error('chat error:', error);
    res.status(500).json({ error: error.message || 'AI调用失败' });
  }
};
