const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.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 });

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 读取文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    // 直接测试 Groq 是否可用（最简单方式）
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: '说一句“你好，AI已就绪”' }],
      model: 'llama3-8b-8192',  // 最稳定免费模型，无配额限制
      temperature: 0,
      max_tokens: 50,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || 'AI无回复';

    res.status(200).json({ 
      summary: `API测试成功！文件大小：${buffer.length} bytes\n\nAI回复：${reply}`,
      success: true 
    });

  } catch (error) {
    console.error('Final error:', error);
    res.status(500).json({ 
      error: 'API调用失败', 
      message: error.message,
      code: error.code || 'unknown'
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb'
  }
};
