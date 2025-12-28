const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'DEEPSEEK_API_KEY sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX' });
    }

    // 读取文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    if (buffer.length === 0) {
      return res.status(400).json({ error: '未收到文件数据' });
    }

    // 解析 PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.substring(0, 20000);

    if (!text.trim()) {
      return res.status(400).json({ error: 'PDF 无可提取文本（可能是纯图片扫描件）' });
    }

    // 调用 DeepSeek
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的PDF总结助手，用简洁自然的中文回复。' },
          { role: 'user', content: `请总结以下PDF内容（300字以内）：\n${text}` }
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    });

    // 关键：检查响应状态
    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(500).json({ 
        error: `DeepSeek API错误 ${response.status}`, 
        details: errText 
      });
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim() || 'AI无回复';

    res.status(200).json({ summary, success: true });
  } catch (error) {
    console.error('Final error:', error);
    res.status(500).json({ 
      error: '上传处理失败', 
      details: error.message || '未知错误' 
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb'
  }
};
