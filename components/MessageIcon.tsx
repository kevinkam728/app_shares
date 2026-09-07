'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle } from 'lucide-react'

export default function MessageIcon() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .eq('read', false)
            
            setUnreadCount(count || 0)
        }
        init()
    }, [supabase])

    useEffect(() => {
        if (!currentUser) return

        const channel = supabase.channel('unread-messages')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `receiver_id=eq.${currentUser.id}`
            }, (payload) => {
                if (!payload.new.read) {
                    setUnreadCount(prev => prev + 1)
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [currentUser, supabase])

    return (
        <Link href="/messages" className="relative p-2 hover:bg-gray-700 rounded-full transition-colors">
            <MessageCircle size={24} className="text-gray-300" />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-[10px] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    )
}
