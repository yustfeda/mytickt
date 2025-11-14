import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { listenToUsers, sendGlobalMessage, sendPrivateMessage } from '../../services/firebase';

const ManageMessages = () => {
    const [tab, setTab] = useState<'global' | 'private'>('global');
    const [globalMessage, setGlobalMessage] = useState('');
    const [privateMessage, setPrivateMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const unsub = listenToUsers(setUsers);
        return () => unsub();
    }, []);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(''), 3000);
    }
    const handleGlobalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendGlobalMessage(globalMessage, users);
        showNotification('Pesan global terkirim ke semua pengguna!');
        setGlobalMessage('');
    }
    const handlePrivateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedUser) {
            showNotification('Silakan pilih pengguna.');
            return;
        }
        await sendPrivateMessage(selectedUser, privateMessage);
        showNotification(`Pesan pribadi terkirim ke ${users.find(u=>u.uid === selectedUser)?.nickname}!`);
        setPrivateMessage('');
        setSelectedUser('');
    }

    return <div className="bg-gray-800 p-4 rounded-lg space-y-4 max-w-lg">
        <div className="flex border-b border-gray-600">
            <button onClick={() => setTab('global')} className={`px-4 py-2 ${tab === 'global' ? 'border-b-2 border-brand-orange' : 'text-gray-400'}`}>Global</button>
            <button onClick={() => setTab('private')} className={`px-4 py-2 ${tab === 'private' ? 'border-b-2 border-brand-orange' : 'text-gray-400'}`}>Pribadi</button>
        </div>
        {tab === 'global' ? (
            <form onSubmit={handleGlobalSubmit} className="space-y-4">
                <textarea value={globalMessage} onChange={e => setGlobalMessage(e.target.value)} placeholder="Tulis pengumuman global..." required className="bg-gray-700 p-2 rounded-md w-full text-white h-24" />
                <button type="submit" className="bg-brand-blue text-white p-2 rounded-md hover:bg-blue-600 w-full">Kirim ke Semua Pengguna</button>
            </form>
        ) : (
            <form onSubmit={handlePrivateSubmit} className="space-y-4">
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required className="w-full bg-gray-700 p-2 rounded-md text-white">
                    <option value="">Pilih Pengguna</option>
                    {users.filter(u => u.role === 'user').map(u => <option key={u.uid} value={u.uid}>{u.nickname} ({u.email})</option>)}
                </select>
                <textarea value={privateMessage} onChange={e => setPrivateMessage(e.target.value)} placeholder="Tulis pesan pribadi..." required className="bg-gray-700 p-2 rounded-md w-full text-white h-24" />
                <button type="submit" className="bg-brand-blue text-white p-2 rounded-md hover:bg-blue-600 w-full">Kirim Pesan Pribadi</button>
            </form>
        )}
        {notification && <p className="text-green-400 text-center mt-2">{notification}</p>}
    </div>;
};

export default ManageMessages;
