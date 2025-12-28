const express = require('express');
const chatHandler = require('./api/chat');
const uploadPdfHandler = require('./api/upload-pdf');
const mindmapHandler = require('./api/mindmap');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use(express.static('public'));

// API 路由
app.post('/api/chat', async (req, res) => {
  await chatHandler(req, res);
});

app.post('/api/upload-pdf', async (req, res) => {
  await uploadPdfHandler(req, res);
});

app.post('/api/mindmap', async (req, res) => {
  await mindmapHandler(req, res);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
