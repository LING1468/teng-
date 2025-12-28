// api/upload-pdf.js - DeepSeek 直接 POST 请求植入版
const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'DeepSeek API Key sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX' });
    }

    // 读取上传的PDF文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    // 解析PDF文本
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 20000); // 限制长度

    if (!text.trim()) {
      return res.status(400).json({ error: 'PDF 无文本内容' });
    }

    // 直接 POST 请求 DeepSeek API（核心植入部分）
    const deepseekResponse = await fetch('https://tb.api.mkeai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',  // 通用模型
        messages: [
          { role: 'system', content: '你是一个专业的文档总结助手，用简洁自然的中文回复。' },
          { role: 'user', content: `请总结以下文档内容（400字以内）：\n${text}` }
        ],
        temperature: 0.6,
        max_tokens: 500
      })
    });

    if (!deepseekResponse.ok) {
      const err = await deepseekResponse.text();
      throw new Error(`DeepSeek API错误: ${deepseekResponse.status} ${err}`);
    }

    const data = await deepseekResponse.json();
    const summary = data.choices[0]?.message?.content?.trim() || 'AI未能生成总结';

    // 返回给前端
    res.status(200).json({ summary, success: true });

  } catch (error) {
    console.error('DeepSeek调用失败:', error);
    res.status(500).json({ error: error.message || 'AI处理失败' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb'
  }
};

