'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
    const router = useRouter()
    const supabase = createClient()
    const [notifications, setNotifications] = useState<any[]>([])

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }

            const { data } = await supabase
                .from('notifications')
                .select('*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            
            if (data) setNotifications(data)
        }
        fetchNotifications()
    }, [])

    const markAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <button onClick={() => router.push('/')} className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 p-2 rounded-full">Volver</button>
            <div className="max-w-2xl mx-auto mt-16">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Notificaciones</h1>
                    <button onClick={markAllRead} className="text-sm text-blue-400 hover:text-blue-300">Marcar todas como leídas</button>
                </div>
                <div className="space-y-4">
                    {notifications.map(n => (
                        <div key={n.id} className={`p-4 rounded-lg flex items-center gap-4 ${n.read ? 'bg-gray-800' : 'bg-slate-800'}`}>
                            {n.actor?.avatar_url ? <img src={n.actor.avatar_url} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">{n.actor?.username?.[0]}</div>}
                            <p className="text-sm">
                                {n.type === 'message' 
                                    ? <>tienes un mensaje nuevo de <strong>{n.actor?.username}</strong></>
                                    : <><span className="font-bold">{n.actor?.username}</span> {n.type === 'like' ? 'le dio me gusta a tu publicación' : n.type === 'comment' ? 'comentó tu publicación' : 'comenzó a seguirte'}</>
                                }
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
