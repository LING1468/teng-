module.exports = async (req, res) => {
  // 强制返回 JSON，防止 Vercel HTML 错误页
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST' });
  }

  try {
    // 读取文件流
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const buffer = Buffer.concat(buffers);

    // 直接返回成功（测试函数是否正常运行）
    res.status(200).json({
      summary: `后端函数正常运行！收到文件大小：${buffer.length} bytes`,
      success: true,
      tip: '如果看到这条消息，说明500错误已解决，可以恢复完整AI功能'
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: '测试失败', message: error.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb'
  }
};
