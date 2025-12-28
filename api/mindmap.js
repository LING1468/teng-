const { getSession } = require('./session-store');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ error: '缺少 sessionId' });
    }

    const session = getSession(sessionId);
    if (!session || !session.pdfText) {
      return res.status(400).json({ error: '会话不存在或已过期' });
    }

    const apiKey = 'sk-vM4srYxtuCMyhnWrbWsFACXPd3fu3PBzBSgioORrzHJ6QPSX';
    const baseUrl = 'https://tb.api.mkeai.com';

    const pdfPreview = session.pdfText.substring(0, 5000);

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的思维导图生成助手。

请将用户提供的内容转换为 markdown 格式的思维导图。

输出格式：
# 中心主题
## 主要分支1
- 子项1
  - 细节1
  - 细节2
- 子项2
## 主要分支2
- 子项1
- 子项2

要求：
- 只输出 markdown，不要任何其他说明
- 使用简洁的短语
- 每层2-4个项目
- 最多3-4层深度`
          },
          {
            role: 'user',
            content: `请将以下内容转换为 markdown 格式的思维导图：\n\n${pdfPreview}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`API错误 ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    console.log('Mindmap API Response:', JSON.stringify(data, null, 2));

    let content = data.choices?.[0]?.message?.content;
    const reasoningContent = data.choices?.[0]?.message?.reasoning_content;

    console.log('Content:', content?.substring(0, 200));
    console.log('Reasoning:', reasoningContent?.substring(0, 200));

    // 优先使用 content，如果为空则使用 reasoning_content
    if (!content || !content.trim()) {
      content = reasoningContent;
    }

    if (!content || !content.trim()) {
      console.error('Mindmap API response missing content:', data);
      return res.status(500).json({ error: '生成思维导图失败，API未返回内容。请重试。' });
    }

    // 清理 markdown
    let markdown = content.trim();
    markdown = markdown.replace(/```markdown\n?/g, '').replace(/```\n?/g, '');

    res.status(200).json({ markdown });
  } catch (error) {
    console.error('Mindmap Error:', error);
    res.status(500).json({ error: error.message || '生成失败' });
  }
};
