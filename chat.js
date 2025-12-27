import { Groq } from 'groq-sdk';
import { Redis } from '@upstash/redis';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, sessionId } = req.body;
  if (!message || !sessionId) return res.status(400).json({ error: '参数缺失' });

  try {
    const contextJson = await redis.get(`session:${sessionId}`);
    if (!contextJson) return res.status(400).json({ error: '会话过期，请重新上传PDF' });

    let context = JSON.parse(contextJson);
    context.push({ role: 'user', content: message });

    const completion = await groq.chat.completions.create({
      messages: context,
      model: 'llama-3.1-70b-versatile',
      max_tokens: 1024,
    });

    const reply = completion.choices[0].message.content.trim();
    context.push({ role: 'assistant', content: reply });

    await redis.set(`session:${sessionId}`, JSON.stringify(context), { ex: 86400 });

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
}
