import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { listenToProducts, addProduct, updateProduct, deleteProduct } from '../../services/firebase';
import Modal from '../../components/common/Modal';

// Modal Form Component nested for co-location
const ProductFormModal: React.FC<{ product: Partial<Product> | null; onSave: (data: Partial<Product>) => void; onClose: () => void; }> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Product>>(product || {});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.checked });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return <Modal isOpen={true} onClose={onClose} title={formData.id ? 'Edit Produk' : 'Tambah Produk'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Nama Produk" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Deskripsi" className="w-full bg-gray-700 p-2 rounded-md h-20 text-white" required/>
            <input name="category" value={formData.category || ''} onChange={handleChange} placeholder="Kategori" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="URL Gambar" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <input name="buyLink" value={formData.buyLink || ''} onChange={handleChange} placeholder="URL Bayar Popup" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            <div className="flex gap-4">
                <input name="price" type="number" value={formData.price || ''} onChange={handleChange} placeholder="Harga" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
                <input name="stock" type="number" value={formData.stock || ''} onChange={handleChange} placeholder="Stok" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
            </div>
            <label className="flex items-center gap-2"><input name="isActive" type="checkbox" checked={formData.isActive || false} onChange={handleCheckbox} className="w-5 h-5 accent-brand-orange" /> Aktifkan produk</label>
            <button type="submit" className="w-full bg-brand-orange py-2 rounded-md">Simpan</button>
        </form>
    </Modal>;
}


const ManageProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = listenToProducts(setProducts);
        return () => unsubscribe();
    }, []);

    const handleSave = async (productData: Partial<Product>) => {
        if (productData.id) {
            const { id, ...updates } = productData;
            await updateProduct(id, updates);
        } else {
            const initialStock = Number(productData.stock) || 0;
            const newProduct: Omit<Product, 'id'> = {
                ...productData,
                stock: initialStock,
                maxStock: initialStock,
            } as Omit<Product, 'id'>;
            await addProduct(newProduct);
        }
        setIsModalOpen(false);
        setEditingProduct(null);
    };
    
    const handleDelete = async (id: string) => {
        await deleteProduct(id);
        setDeleteConfirm(null);
    }

    return (
        <div className="space-y-4">
            <button onClick={() => { setEditingProduct({ isActive: true, stock: 0, price: 0, maxStock: 0 }); setIsModalOpen(true); }} className="bg-brand-blue text-white py-2 px-4 rounded-md">Tambah Produk Baru</button>
            {isModalOpen && <ProductFormModal product={editingProduct} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {deleteConfirm && <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus">
                <p>Anda yakin ingin menghapus produk ini?</p>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={() => setDeleteConfirm(null)} className="py-2 px-4 rounded-md bg-gray-600">Tidak</button>
                    <button onClick={() => handleDelete(deleteConfirm)} className="py-2 px-4 rounded-md bg-red-600">Ya, Hapus</button>
                </div>
            </Modal>}
             <div className="overflow-x-auto bg-gray-800 rounded-md">
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-600"><th className="p-3">Nama</th><th className="p-3">Kategori</th><th className="p-3">Stok</th><th className="p-3">Aktif</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="border-b border-gray-700">
                                <td className="p-3">{p.name}</td>
                                <td className="p-3">{p.category}</td>
                                <td className="p-3">{p.stock} / {p.maxStock}</td>
                                <td className="p-3">{p.isActive ? 'Ya' : 'Tidak'}</td>
                                <td className="p-3 space-x-2">
                                    <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-blue-400 hover:text-blue-300"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => setDeleteConfirm(p.id)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    )
}

export default ManageProducts;