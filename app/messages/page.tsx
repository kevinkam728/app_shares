'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, User } from 'lucide-react'

export default function MessagesPage() {
    const router = useRouter()
    const supabase = createClient()
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [contacts, setContacts] = useState<any[]>([])
    const [selectedContact, setSelectedContact] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchUserAndContacts = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setCurrentUser(user)

            const { data: profiles } = await supabase.from('profiles').select('*').neq('id', user.id)
            if (profiles) setContacts(profiles)
        }
        fetchUserAndContacts()
    }, [])

    useEffect(() => {
        if (!selectedContact || !currentUser) return

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUser.id})`)
                .order('created_at', { ascending: true })
            if (data) setMessages(data)
        }
        fetchMessages()

        const channel = supabase.channel('messages_channel')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
            }, (payload) => {
                setMessages((prev) => {
                    // Evitar duplicar el mensaje que ya insertó el emisor localmente
                    if (prev.some(msg => msg.id === payload.new.id)) return prev;

                    const isRelevant = 
                      (payload.new.sender_id === currentUser.id && payload.new.receiver_id === selectedContact.id) ||
                      (payload.new.sender_id === selectedContact.id && payload.new.receiver_id === currentUser.id);

                    if (isRelevant) {
                        return [...prev, payload.new];
                    }
                    return prev;
                });
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [selectedContact, currentUser])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !selectedContact || !currentUser) return;

        // 1. Crear un mensaje temporal para la UI
        const tempId = crypto.randomUUID();
        const tempMsg = {
            id: tempId,
            sender_id: currentUser.id,
            receiver_id: selectedContact.id,
            content: newMessage,
            created_at: new Date().toISOString()
        };

        // 2. Actualizar estado INMEDIATAMENTE (Optimistic)
        setMessages((prev) => [...prev, tempMsg]);
        const messageToSend = newMessage;
        setNewMessage('');

        // 3. Enviar a Supabase en segundo plano
        const { data, error } = await supabase
            .from('messages')
            .insert([{ 
                sender_id: currentUser.id, 
                receiver_id: selectedContact.id, 
                content: messageToSend 
            }])
            .select();

        if (error) {
            console.error("Error al enviar mensaje:", error);
            // Revertir: eliminar el mensaje temporal si falla
            setMessages((prev) => prev.filter(msg => msg.id !== tempId));
        } else if (data && data[0]) {
            // 4. Reemplazar el mensaje temporal con el real de la DB
            setMessages((prev) => 
                prev.map(msg => msg.id === tempId ? data[0] : msg)
            );
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <button onClick={() => router.push('/')} className="fixed top-6 left-6 z-50 bg-gray-800 hover:bg-gray-700 p-2 rounded-full">Volver</button>
            <div className="w-1/3 border-r border-gray-700 p-4">
                <h2 className="text-xl font-bold mb-4">Contactos</h2>
                {contacts.map(contact => (
                    <button key={contact.id} onClick={() => setSelectedContact(contact)} className={`w-full p-3 rounded flex items-center gap-3 hover:bg-gray-800 ${selectedContact?.id === contact.id ? 'bg-gray-800' : ''}`}>
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">{contact.username?.[0]}</div>
                        {contact.username}
                    </button>
                ))}
            </div>
            <div className="flex-1 flex flex-col">
                {selectedContact ? (
                    <>
                        <div className="p-4 border-b border-gray-700 font-bold">{selectedContact.username}</div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-xs ${msg.sender_id === currentUser.id ? 'bg-blue-600' : 'bg-gray-700'}`}>{msg.content}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-700 flex gap-2">
                            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-gray-800 p-2 rounded" placeholder="Escribe..." />
                            <button onClick={() => handleSendMessage()} className="bg-blue-600 p-2 rounded"><Send size={20} /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Selecciona un contacto</div>
                )}
            </div>
        </div>
    )
}
