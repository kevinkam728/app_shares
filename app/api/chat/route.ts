import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: messages,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        return NextResponse.json(
          { error: data.error?.message || 'Error desconocido de OpenAI' }, 
          { status: response.status }
        );
    }

    return NextResponse.json(data.choices[0].message);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
