import React, { useState, useEffect } from 'react';
import type { Review } from '../../types';
import { listenToReviews, addReview, updateReview, deleteReview } from '../../services/firebase';
import Modal from '../../components/common/Modal';

// Modal Form Component nested for co-location
const ReviewFormModal: React.FC<{ review: Partial<Review> | null; onSave: (data: Partial<Review>) => void; onClose: () => void; }> = ({ review, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Review>>(review || {});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return <Modal isOpen={true} onClose={onClose} title={formData.id ? 'Edit Ulasan' : 'Tambah Ulasan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="author" value={formData.author || ''} onChange={handleChange} placeholder="Penulis" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <textarea name="text" value={formData.text || ''} onChange={handleChange} placeholder="Isi ulasan" className="w-full bg-gray-700 p-2 rounded-md h-24 text-white" required/>
            <button type="submit" className="w-full bg-brand-orange py-2 rounded-md">Simpan</button>
        </form>
    </Modal>;
}


const ManageReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [editingReview, setEditingReview] = useState<Partial<Review> | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = listenToReviews(setReviews);
        return () => unsubscribe();
    }, []);

    const handleSave = async (reviewData: Partial<Review>) => {
        if (reviewData.id) {
            const { id, ...updates } = reviewData;
            await updateReview(id, updates);
        } else {
            await addReview(reviewData as Omit<Review, 'id'|'createdAt'>);
        }
        setEditingReview(null);
    };

    const handleDelete = async (id: string) => {
        await deleteReview(id);
        setDeleteConfirm(null);
    }

    return (
        <div className="space-y-4">
            <button onClick={() => setEditingReview({})} className="bg-brand-blue text-white py-2 px-4 rounded-md">Tambah Ulasan Baru</button>
            {editingReview && <ReviewFormModal review={editingReview} onSave={handleSave} onClose={() => setEditingReview(null)} />}
            {deleteConfirm && <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus">
                <p>Anda yakin ingin menghapus ulasan ini?</p>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={() => setDeleteConfirm(null)} className="py-2 px-4 rounded-md bg-gray-600">Tidak</button>
                    <button onClick={() => handleDelete(deleteConfirm)} className="py-2 px-4 rounded-md bg-red-600">Ya, Hapus</button>
                </div>
            </Modal>}
             <div className="overflow-x-auto bg-gray-800 rounded-md">
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-600"><th className="p-3">Penulis</th><th className="p-3">Ulasan</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {reviews.map(r => (
                            <tr key={r.id} className="border-b border-gray-700">
                                <td className="p-3">{r.author}</td>
                                <td className="p-3 max-w-md">{r.text}</td>
                                <td className="p-3 space-x-2">
                                    <button onClick={() => setEditingReview(r)} className="text-blue-400 hover:text-blue-300"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => setDeleteConfirm(r.id)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    )
}

export default ManageReviews;
