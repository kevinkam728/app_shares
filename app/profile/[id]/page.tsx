'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, User } from 'lucide-react'

export default function PublicProfilePage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<any>(null)
    const [trades, setTrades] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfileData = async () => {
            const userId = params.id as string
            
            // Obtener perfil
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            
            if (profileData) {
                setProfile(profileData)
                
                // Si el perfil es público, obtener trades
                if (profileData.is_portfolio_public) {
                    const { data: tradeData } = await supabase
                        .from('simulated_trades')
                        .select('*')
                        .eq('user_id', userId)
                    
                    if (tradeData) setTrades(tradeData)
                }
            }
            setLoading(false)
        }
        fetchProfileData()
    }, [params.id])

    if (loading) return <div className="p-8 text-white">Cargando perfil...</div>
    if (!profile) return <div className="p-8 text-white">Perfil no encontrado.</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <button onClick={() => router.back()} className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-gray-600">
                Volver
            </button>

            <div className="max-w-2xl mx-auto mt-16 bg-gray-800 p-8 rounded-xl border border-gray-700">
                <div className="flex items-center gap-6 mb-8">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username} className="w-24 h-24 rounded-full" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                            <User size={40} className="text-gray-500" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold">{profile.username}</h1>
                        <p className="text-gray-400 mt-2">{profile.bio || 'Sin biografía.'}</p>
                    </div>
                </div>

                {profile.is_portfolio_public ? (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Portafolio Público</h2>
                        {trades.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="pb-2">Ticker</th>
                                        <th className="pb-2">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trades.map((trade: any) => (
                                        <tr key={trade.id} className="border-b border-gray-700/50">
                                            <td className="py-3 font-mono">{trade.ticker}</td>
                                            <td className="py-3">{trade.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500">No hay operaciones registradas.</p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-8 text-gray-500 border-t border-gray-700">
                        <Lock size={48} />
                        <p>Este portafolio es privado.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
