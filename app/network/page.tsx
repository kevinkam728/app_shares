'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Users } from 'lucide-react'

export default function NetworkPage() {
    const router = useRouter()
    const supabase = createClient()
    const [users, setUsers] = useState<any[]>([])
    const [following, setFollowing] = useState<string[]>([])
    const [currentUser, setCurrentUser] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setCurrentUser(user.id)

            // Obtener todos los perfiles excepto el actual
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id)
            
            if (profiles) setUsers(profiles)

            // Obtener a quiénes sigue
            const { data: follows } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', user.id)
            
            if (follows) setFollowing(follows.map(f => f.following_id))
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleToggleFollow = async (targetUserId: string) => {
        if (!currentUser) return
        
        const isFollowing = following.includes(targetUserId)

        if (isFollowing) {
            await supabase
                .from('followers')
                .delete()
                .eq('follower_id', currentUser)
                .eq('following_id', targetUserId)
            setFollowing(prev => prev.filter(id => id !== targetUserId))
        } else {
            await supabase
                .from('followers')
                .insert({ follower_id: currentUser, following_id: targetUserId })
            setFollowing(prev => [...prev, targetUserId])
        }
    }

    if (loading) return <div className="p-8 text-center text-white">Cargando red...</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <button onClick={() => router.push('/')} className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-gray-600">
                Volver
            </button>
            <div className="max-w-4xl mx-auto mt-16">
                <h1 className="text-3xl font-bold mb-8 text-center">Red de Inversores</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <Link href={`/profile/${user.id}`} key={user.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col gap-4 hover:border-gray-500 transition-colors">
                            <div className="flex items-center gap-3">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} className="w-12 h-12 rounded-full" />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center font-bold">
                                        {user.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                                <h3 className="font-bold text-lg">{user.username || 'Usuario'}</h3>
                            </div>
                            <p className="text-sm text-gray-400 flex-1">{user.bio || 'Sin biografía'}</p>
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFollow(user.id); }}
                                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                                    following.includes(user.id) 
                                        ? 'bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400' 
                                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                                {following.includes(user.id) ? 'Siguiendo' : 'Seguir'}
                            </button>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
