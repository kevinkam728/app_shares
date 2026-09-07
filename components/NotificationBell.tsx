'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false)
            
            setUnreadCount(count || 0)
        }
        init()
    }, [])

    useEffect(() => {
        if (!currentUser) return

        const channel = supabase.channel('bell-alerts')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${currentUser.id}`
            }, (payload) => {
                if (!payload.new.read) {
                    setUnreadCount(prev => prev + 1)
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [currentUser])

    return (
        <Link href="/notifications" className="relative p-2 hover:bg-gray-700 rounded-full transition-colors">
            <Bell size={24} className="text-gray-300" />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-[10px] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    )
}
