const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.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 });

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 简单读取文件
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    // 直接返回成功（先测试是否能正常返回JSON）
    res.status(200).json({ 
      summary: '测试成功！您的API已正常运行。文件大小：' + buffer.length + ' bytes',
      success: true 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || '未知错误' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb'
  }
};
