import { Groq } from 'groq-sdk';
import pdf from 'pdf-parse';
import { Redis } from '@upstash/redis';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);

  try {
    let chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const data = await pdf(buffer);
    const pdfText = data.text.substring(0, 30000);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: '专业PDF助手，用自然中文总结。' },
        { role: 'user', content: `总结以下PDF（300字内）：\n${pdfText}` }
      ],
      model: 'llama-3.1-70b-versatile',
    });

    const summary = completion.choices[0].message.content.trim();

    const context = [
      { role: 'system', content: `PDF内容：${pdfText.substring(0, 12000)}` },
      { role: 'assistant', content: summary }
    ];
    await redis.set(`session:${sessionId}`, JSON.stringify(context), { ex: 86400 });

    res.status(200).json({ summary, sessionId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const config = { api: { bodyParser: false, sizeLimit: '15mb' } };
