import React, { useState, useEffect } from 'react';
import type { CustomButton } from '../../types';
import { listenToCustomButtons, addCustomButton, updateCustomButton, deleteCustomButton } from '../../services/firebase';
import Modal from '../../components/common/Modal';

const ButtonFormModal: React.FC<{ button: Partial<CustomButton> | null; onSave: (data: Partial<CustomButton>) => void; onClose: () => void; }> = ({ button, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<CustomButton>>(button || { isActive: true });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.checked });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return <Modal isOpen={true} onClose={onClose} title={formData.id ? 'Edit Tombol' : 'Tambah Tombol'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Nama Tombol (Label)" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <input name="url" value={formData.url || ''} onChange={handleChange} placeholder="URL (Call to Action)" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <input name="icon" value={formData.icon || ''} onChange={handleChange} placeholder="Ikon (contoh: fa-link)" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <label className="flex items-center gap-2"><input name="isActive" type="checkbox" checked={formData.isActive || false} onChange={handleCheckbox} className="w-5 h-5 accent-brand-orange" /> Tampilkan tombol</label>
            <p className="text-xs text-gray-400">Gunakan kelas ikon dari Font Awesome (e.g., fa-star, fa-gamepad, etc.).</p>
            <button type="submit" className="w-full bg-brand-orange py-2 rounded-md">Simpan</button>
        </form>
    </Modal>;
}

const ManageButtons = () => {
    const [buttons, setButtons] = useState<CustomButton[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingButton, setEditingButton] = useState<Partial<CustomButton> | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = listenToCustomButtons(setButtons);
        return () => unsubscribe();
    }, []);

    const handleSave = async (buttonData: Partial<CustomButton>) => {
        if (buttonData.id) {
            const { id, ...updates } = buttonData;
            await updateCustomButton(id, updates);
        } else {
            await addCustomButton(buttonData as Omit<CustomButton, 'id'>);
        }
        setIsModalOpen(false);
        setEditingButton(null);
    };
    
    const handleDelete = async (id: string) => {
        await deleteCustomButton(id);
        setDeleteConfirm(null);
    }

    return (
        <div className="space-y-4">
            <p className="text-gray-400">Buat tombol menu kustom yang akan muncul di header dan sidebar untuk pengguna yang sudah login.</p>
            <button onClick={() => { setEditingButton({ isActive: true }); setIsModalOpen(true); }} className="bg-brand-blue text-white py-2 px-4 rounded-md">Tambah Tombol Baru</button>
            {isModalOpen && <ButtonFormModal button={editingButton} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {deleteConfirm && <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus">
                <p>Anda yakin ingin menghapus tombol ini?</p>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={() => setDeleteConfirm(null)} className="py-2 px-4 rounded-md bg-gray-600">Tidak</button>
                    <button onClick={() => handleDelete(deleteConfirm)} className="py-2 px-4 rounded-md bg-red-600">Ya, Hapus</button>
                </div>
            </Modal>}
             <div className="overflow-x-auto bg-gray-800 rounded-md">
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-600"><th className="p-3">Nama</th><th className="p-3">URL</th><th className="p-3">Ikon</th><th className="p-3">Aktif</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {buttons.map(b => (
                            <tr key={b.id} className="border-b border-gray-700">
                                <td className="p-3">{b.name}</td>
                                <td className="p-3 truncate max-w-xs">{b.url}</td>
                                <td className="p-3"><i className={`fas ${b.icon}`}></i> ({b.icon})</td>
                                <td className="p-3">{b.isActive ? 'Ya' : 'Tidak'}</td>
                                <td className="p-3 space-x-2">
                                    <button onClick={() => { setEditingButton(b); setIsModalOpen(true); }} className="text-blue-400 hover:text-blue-300"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => setDeleteConfirm(b.id)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    )
}

export default ManageButtons;