const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.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,
  baseURL: 'https://openrouter.ai/api/v1',
});

const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 方法' });
  }

  try {
    // 检查 API Key
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY 未设置' });
    }

    // 读取上传文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    if (buffer.length === 0) {
      return res.status(400).json({ error: '未收到文件' });
    }

    // 解析 PDF 文本
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 20000); // 限制长度避免超限

    if (!text.trim()) {
      return res.status(400).json({ error: 'PDF 无可提取文本（可能是扫描件）' });
    }

    // 调用 OpenRouter 免费模型总结
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct:free',  // 免费无限模型
      messages: [
        { role: 'system', content: '你是一个专业的PDF总结助手，用简洁自然的中文回复。' },
        { role: 'user', content: `请总结以下PDF内容（控制在300字以内）：\n${text}` }
      ],
      temperature: 0.6,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || 'AI未能生成总结';

    res.status(200).json({ summary, success: true });
  } catch (error) {
    console.error('upload-pdf error:', error);
    res.status(500).json({ 
      error: '服务器内部错误', 
      message: error.message || '未知错误'
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb'
  }
};
