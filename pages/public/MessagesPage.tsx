import React, { useState, useEffect } from 'react';
import type { PrivateMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listenToUserMessages, markMessageAsRead } from '../../services/firebase';
import Modal from '../../components/common/Modal';

const MessagesPage = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<PrivateMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<PrivateMessage | null>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = listenToUserMessages(user.uid, setMessages);
        return () => unsubscribe();
    }, [user]);

    const handleMessageClick = (msg: PrivateMessage) => {
        setSelectedMessage(msg);
        if (!msg.isRead) {
            markMessageAsRead(msg.id);
        }
    };

    return <>
        {selectedMessage && (
            <Modal isOpen={true} onClose={() => setSelectedMessage(null)} title="Pesan dari Admin">
                <p className="text-white whitespace-pre-wrap">{selectedMessage.text}</p>
                 <p className="text-xs text-gray-400 text-right mt-4">{new Date(selectedMessage.timestamp).toLocaleString('id-ID')}</p>
            </Modal>
        )}
        <div className="bg-gray-800 p-4 sm:p-8 rounded-lg shadow-2xl animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 text-brand-orange">Pesan dari Admin</h2>
            <div className="space-y-4">
                {messages.map(msg => (
                    <div 
                        key={msg.id} 
                        onClick={() => handleMessageClick(msg)}
                        className={`p-4 rounded-md cursor-pointer transition-all duration-300 ${!msg.isRead ? 'bg-gray-700 border-l-4 border-brand-orange font-semibold' : 'bg-gray-700/50'}`}
                    >
                        <p className={`truncate ${!msg.isRead ? 'text-white' : 'text-gray-400'}`}>{msg.text}</p>
                        <p className="text-xs text-gray-400 text-right mt-2">{new Date(msg.timestamp).toLocaleString('id-ID')}</p>
                    </div>
                ))}
                {messages.length === 0 && <p className="text-center text-gray-500">Tidak ada pesan.</p>}
            </div>
        </div>
    </>
};

export default MessagesPage;
