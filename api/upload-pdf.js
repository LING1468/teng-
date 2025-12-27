const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: message || '你好' }],
      model: 'llama-3.1-70b-versatile',
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '无回复';
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message || 'AI调用失败' });
  }
};
};
