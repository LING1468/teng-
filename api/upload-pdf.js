import { Groq } from 'groq-sdk';
import pdf from 'pdf-parse';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 读取文件流
    let chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const data = await pdf(buffer);
    const text = data.text.substring(0, 20000);

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: `请用中文总结这份PDF（200字内）：\n${text}` }],
      model: 'llama-3.1-70b-versatile',
    });

    const summary = completion.choices[0]?.message?.content || '总结失败';

    // 简单会话ID（调试用）
    const sessionId = 'debug-' + Date.now();

    res.status(200).json({ summary, sessionId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || '处理失败' });
  }
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb'
  }
};