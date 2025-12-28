const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX' });
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
      return res.status(400).json({ error: 'PDF 无文本内容（可能是扫描件或加密PDF）' });
    }

    // 调用 DeepSeek
    const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
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

    // 详细错误反馈
    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error('DeepSeek API 失败:', deepseekRes.status, errText);
      return res.status(500).json({ 
        error: `DeepSeek API调用失败（状态码 ${deepseekRes.status}）`,
        details: errText.substring(0, 500)
      });
    }

    const data = await deepseekRes.json();

    // 保底检查
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ 
        error: 'DeepSeek 返回格式异常',
        details: JSON.stringify(data).substring(0, 500)
      });
    }

    const summary = data.choices[0].message.content.trim();

    // 成功返回
    res.status(200).json({ summary, success: true });

  } catch (error) {
    console.error('未知错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误', 
      details: error.message.substring(0, 500)
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '15mb'
  }
};
