import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { listenToUsers, updateUser, deleteUser } from '../../services/firebase';
import Modal from '../../components/common/Modal';

// Modal Form Component nested for co-location
const UserFormModal: React.FC<{ user: User | null; onSave: (data: Partial<User>) => void; onClose: () => void; }> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<User>>(user || {});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    // Password editing is disabled for security reasons without a proper auth system.
    return <Modal isOpen={true} onClose={onClose} title={`Edit Pengguna: ${user?.nickname}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="nickname" value={formData.nickname || ''} onChange={handleChange} placeholder="Nama Panggilan" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" className="w-full bg-gray-700 p-2 rounded-md text-white"/>
            <p className="text-sm text-gray-400">Pengeditan password tidak tersedia di panel ini.</p>
            <button type="submit" className="w-full bg-brand-orange py-2 rounded-md">Simpan</button>
        </form>
    </Modal>;
}


const ManageUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = listenToUsers(setUsers);
        return () => unsubscribe();
    }, []);
    
    const handleSave = async (userData: Partial<User>) => {
        if(userData.uid) {
            await updateUser(userData.uid, userData);
        }
        setEditingUser(null);
    }

    const handleDelete = async (uid: string) => {
        await deleteUser(uid);
        setDeleteConfirm(null);
    }

    return <div className="space-y-4">
        {deleteConfirm && <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus">
                <p>Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat diurungkan.</p>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={() => setDeleteConfirm(null)} className="py-2 px-4 rounded-md bg-gray-600">Tidak</button>
                    <button onClick={() => handleDelete(deleteConfirm)} className="py-2 px-4 rounded-md bg-red-600">Ya, Hapus</button>
                </div>
        </Modal>}
         <div className="overflow-x-auto bg-gray-800 rounded-md">
            <table className="w-full text-left">
                <thead><tr className="border-b border-gray-600"><th className="p-3">Nama</th><th className="p-3">Email</th><th className="p-3">Aktif</th><th className="p-3">Aksi</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.uid} className="border-b border-gray-700">
                            <td className="p-3">{u.nickname}</td>
                            <td className="p-3">{u.email || '-'}</td>
                            <td className="p-3"><input type="checkbox" checked={u.isActive} onChange={e => handleSave({ uid: u.uid, isActive: e.target.checked })} className="accent-brand-orange w-5 h-5"/></td>
                            <td className="p-3 space-x-2">
                                <button onClick={() => setEditingUser(u)} className="text-blue-400 hover:text-blue-300"><i className="fas fa-edit"></i></button>
                                <button onClick={() => setDeleteConfirm(u.uid)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
         {editingUser && <UserFormModal user={editingUser} onSave={handleSave} onClose={() => setEditingUser(null)} />}
    </div>;
};

export default ManageUsers;
