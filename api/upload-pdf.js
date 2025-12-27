const { Groq } = require('groq-sdk');
const pdfParse = require('pdf-parse');

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || '' 
});

module.exports = async (req, res) => {
  // 强制返回 JSON，防止 Vercel 默认 HTML 错误页
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 方法' });
  }

  try {
    // 检查 Groq Key
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY 未设置' });
    }

    // 读取文件流
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const buffer = Buffer.concat(buffers);

    if (buffer.length === 0) {
      return res.status(400).json({ error: '未收到文件' });
    }

    // 解析 PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 15000);

    if (!text.trim()) {
      return res.status(400).json({ error: 'PDF 无文本内容（可能是扫描件）' });
    }

    // 调用 Groq
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: '你是一个专业的PDF总结助手，用简洁自然的中文回复。' },
        { role: 'user', content: `请总结以下PDF内容（控制在200字以内）：\n${text}` }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.5,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || 'AI未能生成总结';

    res.status(200).json({ summary, success: true });
  } catch (error) {
    console.error('upload-pdf error:', error);

    // 关键：永远返回 JSON
    res.status(500).json({ 
      error: '服务器内部错误', 
      message: error.message || '未知错误',
      type: error.type || 'unknown'
    });
  }
};

// Vercel 配置
module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb'
  }
};
