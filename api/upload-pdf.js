const { Groq } = require('groq-sdk');
const pdf = require('pdf-parse');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    let chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const data = await pdf(buffer);
    const text = data.text.substring(0, 15000);

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: `请用中文总结这份PDF（200字内）：\n${text}` }],
      model: 'llama-3.1-70b-versatile',
    });

    const summary = completion.choices[0]?.message?.content || '总结失败';

    res.status(200).json({ summary, success: true });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
};

// Vercel 必需配置
module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb'
  }
};
