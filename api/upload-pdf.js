import { Groq } from 'groq-sdk';
import pdf from 'pdf-parse';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    let chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const data = await pdf(buffer);
    const text = data.text.substring(0, 15000);

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: `请用中文总结这份PDF内容（200字以内）：\n${text}` }],
      model: 'llama-3.1-70b-versatile',
    });

    const summary = completion.choices[0]?.message?.content || 'AI总结失败';

    res.status(200).json({ summary, success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb'
  }
};
