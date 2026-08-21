'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

const MENTORS = [
  { 
    name: 'Warren Buffett', 
    style: 'Value Investing', 
    description: 'Enfoque en valor a largo plazo y empresas sólidas.', 
    color: 'bg-blue-600', 
    image: '/warren.jpg',
    prompt: 'Eres Warren Buffett. Tu estilo es el Value Investing. Respondes como un abuelo sabio y paciente. Odias la especulación rápida, el day trading y las criptomonedas. Amas las empresas con ventajas competitivas duraderas (moats) y flujos de caja predecibles. Sé conciso y usa analogías simples. REGLA DE FORMATO Y LONGITUD: Sé extremadamente CONCISO y directo. Tus respuestas NO deben superar los 3 párrafos cortos. Si necesitas listar algo, usa solo viñetas simples (bullet points). TIENES ESTRICTAMENTE PROHIBIDO usar tablas Markdown o formatos complejos.'
  },
  { 
    name: 'Ray Dalio', 
    style: 'Macroeconomía', 
    description: 'Diversificación y All-Weather Portfolio.', 
    color: 'bg-emerald-600', 
    image: '/dalio.jpg',
    prompt: 'Eres Ray Dalio, fundador de Bridgewater. Tu enfoque es la macroeconomía, los ciclos de deuda y la diversificación extrema (All-Weather Portfolio). Eres radicalmente transparente, analítico y te basas en la historia para predecir el futuro. Eres cordial pero muy técnico. REGLA DE FORMATO Y LONGITUD: Sé extremadamente CONCISO y directo. Tus respuestas NO deben superar los 3 párrafos cortos. Si necesitas listar algo, usa solo viñetas simples (bullet points). TIENES ESTRICTAMENTE PROHIBIDO usar tablas Markdown o formatos complejos.'
  },
  { 
    name: 'Cathie Wood', 
    style: 'Innovación Disruptiva', 
    description: 'Tecnología, alto riesgo y alto potencial.', 
    color: 'bg-purple-600', 
    image: '/wood.jpg',
    prompt: 'Eres Cathie Wood, fundadora de ARK Invest. Eres una tecno-optimista extrema. Crees apasionadamente en la innovación disruptiva, la inteligencia artificial, la genómica y Bitcoin. Estás dispuesta a asumir alta volatilidad a cambio de crecimiento exponencial. Tu tono es visionario, enérgico y futurista. REGLA DE FORMATO Y LONGITUD: Sé extremadamente CONCISO y directo. Tus respuestas NO deben superar los 3 párrafos cortos. Si necesitas listar algo, usa solo viñetas simples (bullet points). TIENES ESTRICTAMENTE PROHIBIDO usar tablas Markdown o formatos complejos.'
  },
]

export default function ChatbotPage() {
  const router = useRouter()
  const [selectedMentor, setSelectedMentor] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedMentor) {
      setMessages([{ role: 'assistant', content: `Hola, soy ${selectedMentor.name}. Estoy listo para analizar el mercado bajo mi filosofía de ${selectedMentor.style}. ¿En qué puedo ayudarte hoy?` }])
    }
  }, [selectedMentor])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const userMsg = { role: 'user', content: input }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: selectedMentor.prompt },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                userMsg
            ]
        }),
      })
      
      const assistantMsg = await response.json()
      setMessages([...updatedMessages, assistantMsg])
    } catch (error) {
        console.error("Error:", error)
    } finally {
        setIsLoading(false)
    }
  }

  if (!selectedMentor) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-12 text-center">Elige a tu Asesor Financiero IA</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {MENTORS.map((m) => (
            <div 
              key={m.name} 
              onClick={() => setSelectedMentor(m)}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 cursor-pointer hover:scale-105 transition-transform"
            >
              {m.image ? (
                <img src={m.image} alt={m.name} className="w-16 h-16 rounded-full mb-4 mx-auto object-cover" />
              ) : (
                <div className={`w-16 h-16 ${m.color} rounded-full mb-4 mx-auto`} />
              )}
              <h2 className="text-xl font-bold text-center">{m.name}</h2>
              <p className="text-blue-400 text-center mb-2">{m.style}</p>
              <p className="text-gray-400 text-sm text-center">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-4 bg-gray-800 flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-gray-700 rounded hover:bg-gray-600">🏠 Inicio</Link>
        <button onClick={() => setSelectedMentor(null)} className="p-2 bg-gray-700 rounded hover:bg-gray-600">← Cambiar Mentor</button>
        {selectedMentor.image ? (
            <img src={selectedMentor.image} alt={selectedMentor.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
            <div className={`w-10 h-10 ${selectedMentor.color} rounded-full`} />
        )}
        <h2 className="text-xl font-bold">{selectedMentor.name}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-md ${m.role === 'user' ? 'bg-blue-600 ml-auto' : 'bg-gray-700'}`}>
            <div className="text-sm flex flex-col gap-2 [&>ul]:list-disc [&>ul]:list-inside [&>p]:mb-2 [&>strong]:font-bold">
                <ReactMarkdown>
                  {m.content}
                </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && <div className="p-3 bg-gray-700 rounded-lg max-w-md italic">El mentor está escribiendo...</div>}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 flex gap-2">
        <input 
            type="text" 
            className="flex-1 p-2 bg-gray-700 rounded border border-gray-600"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu consulta..."
            disabled={isLoading}
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 rounded" disabled={isLoading}>Enviar</button>
      </form>
    </div>
  )
}
