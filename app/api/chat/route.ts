import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: body.messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de la API:", data);
      return NextResponse.json(
        { error: data.error?.message || 'Error de Groq' },
        { status: response.status }
      );
    }

    return NextResponse.json(data.choices[0].message);

  } catch (error) {
    console.error("Error del servidor:", error);
    return NextResponse.json(
      { error: 'Error interno del servidor local' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ status: "¡LA API ESTÁ VIVA Y ESCUCHANDO!" });
}
