const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.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,
  baseURL: 'https://openrouter.ai/api/v1',
});

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 方法' });
  }

  const { message, sessionId } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: '消息不能为空' });
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY 未设置' });
    }

    // 多轮聊天（可扩展为带上下文）
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct:free',  // 免费模型
      messages: [
        { role: 'system', content: '你是一个专业的PDF内容助手，用自然中文回复用户问题。' },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '无回复';

    res.status(200).json({ reply });
  } catch (error) {
    console.error('chat error:', error);
    res.status(500).json({ 
      error: 'AI调用失败', 
      message: error.message || '未知错误'
    });
  }
};
