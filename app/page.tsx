import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
        Tu Simulador de Inversiones en Tiempo Real
      </h1>
      <p className="text-xl text-gray-400 mb-10 max-w-2xl">
        Gestiona tu portafolio, analiza acciones en tiempo real y perfecciona tu estrategia sin arriesgar capital real.
      </p>
      <Link 
        href="/login" 
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-lg transition-all transform hover:scale-105"
      >
        Empezar a Invertir
      </Link>
    </div>
  )
}
