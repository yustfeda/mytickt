import React, { useState, useEffect } from 'react';
import type { AdminPage, Product, User, Review, PurchaseHistoryItem, LeaderboardEntry, CustomButton } from '../types';
import { adminMenuItems } from '../config/navigation';
import Modal from '../components/common/Modal';
import { 
    listenToProducts, addProduct, updateProduct, deleteProduct,
    listenToUsers, updateUser, deleteUser,
    listenToReviews, addReview, updateReview, deleteReview,
    listenToUserPurchaseHistory, updatePurchaseStatus,
    listenToLeaderboard,
    sendGlobalMessage, sendPrivateMessage,
    listenToCustomButtons, addCustomButton, updateCustomButton, deleteCustomButton
} from '../services/firebase';

// Sub-component: AdminDashboard
const AdminDashboard = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    useEffect(() => {
        const unsubProducts = listenToProducts(setProducts);
        const unsubReviews = listenToReviews(setReviews);
        return () => { unsubProducts(); unsubReviews(); };
    }, []);
    return <div>
        <h2 className="text-2xl font-bold mb-4">Produk Tersedia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.filter(p => p.isActive).map(p => <div key={p.id} className="bg-gray-800 p-4 rounded-md"><h3>{p.name}</h3><p>Stok: {p.stock}</p></div>)}
        </div>
         <h2 className="text-2xl font-bold mt-8 mb-4">Ulasan Terbaru</h2>
        <div className="space-y-4">
            {reviews.slice(0, 5).map(r => <div key={r.id} className="bg-gray-800 p-4 rounded-md"><p>"{r.text}"</p><p className="text-right text-sm text-brand-orange">- {r.author}</p></div>)}
        </div>
    </div>;
};

// Sub-component: ManageProducts
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
                <input name="buyLink" value={formData.buyLink || ''} onChange={handleChange} placeholder="URL Beli" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
                <div className="flex gap-4">
                    <input name="price" type="number" value={formData.price || ''} onChange={handleChange} placeholder="Harga" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
                    <input name="stock" type="number" value={formData.stock || ''} onChange={handleChange} placeholder="Stok" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
                </div>
                <label className="flex items-center gap-2"><input name="isActive" type="checkbox" checked={formData.isActive || false} onChange={handleCheckbox} className="w-5 h-5 accent-brand-orange" /> Aktifkan produk</label>
                <button type="submit" className="w-full bg-brand-orange py-2 rounded-md">Simpan</button>
            </form>
        </Modal>;
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
};

// Sub-component: ManageUsers
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
    
    const UserFormModal: React.FC<{ user: User | null; onSave: (data: Partial<User>) => void; onClose: () => void; }> = ({ user, onSave, onClose }) => {
        const [formData, setFormData] = useState<Partial<User>>(user || {});
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
        const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
        return <Modal isOpen={true} onClose={onClose} title={`Edit Pengguna: ${user?.nickname}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="nickname" value={formData.nickname || ''} onChange={handleChange} placeholder="Nama Panggilan" className="w-full bg-gray-700 p-2 rounded-md text-white" required/>
                <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" className="w-full bg-gray-700 p-2 rounded-md text-white"/>
                <p className="text-sm text-gray-400">Pengeditan password tidak tersedia di panel ini.</p>
                <button type="submit" className="w-full bg-brand-orange py-2 rounded-md">Simpan</button>
            </form>
        </Modal>;
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

// Sub-component: ManagePurchases
const ManagePurchases = () => {
    const [tab, setTab] = useState<'mysterybox' | 'product'>('mysterybox');
    const [allHistory, setAllHistory] = useState<PurchaseHistoryItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [confirmingPurchase, setConfirmingPurchase] = useState<PurchaseHistoryItem | null>(null);

    useEffect(() => {
        const unsubHistory = listenToUserPurchaseHistory(null, setAllHistory);
        const unsubUsers = listenToUsers(setUsers);
        return () => { unsubHistory(); unsubUsers(); };
    }, []);

    const getUserNickname = (userId: string) => users.find(u => u.uid === userId)?.nickname || 'User Tidak Dikenal';

    const handleUpdateStatus = async (item: PurchaseHistoryItem, status: 'success' | 'rejected') => {
        if(item.type === 'mysterybox' && status === 'success') {
            setConfirmingPurchase(item); // Open prize modal
        } else {
            await updatePurchaseStatus(item.id, status);
        }
    };
    
    const handleSavePrize = async (prize: string) => {
        if(confirmingPurchase) {
            await updatePurchaseStatus(confirmingPurchase.id, 'success', prize);
        }
        setConfirmingPurchase(null);
    };

    const purchasesToShow = allHistory.filter(p => p.type === tab);
    
    const PrizeModal: React.FC<{ onSave: (prize: string) => void; onClose: () => void; }> = ({ onSave, onClose }) => {
        const [prize, setPrize] = useState('');
        return <Modal isOpen={true} onClose={onClose} title="Tentukan Hadiah">
            <p className="mb-2 text-gray-300">Masukkan nama hadiah untuk pemenang. Kosongkan jika tidak menang.</p>
            <input 
                value={prize} 
                onChange={e => setPrize(e.target.value)} 
                placeholder="Contoh: Baju Edisi Terbatas" 
                className="w-full bg-gray-700 p-2 rounded-md text-white mb-4"
            />
            <div className="flex justify-end gap-4">
                <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600">Batal</button>
                <button onClick={() => onSave(prize)} className="py-2 px-4 rounded-md bg-brand-orange">Simpan & Setujui</button>
            </div>
        </Modal>;
    }

    return (
        <div className="space-y-6">
            {confirmingPurchase && <PrizeModal onClose={() => setConfirmingPurchase(null)} onSave={handleSavePrize} />}
            <div className="flex border-b border-gray-600">
                <button onClick={() => setTab('mysterybox')} className={`px-4 py-2 text-lg ${tab === 'mysterybox' ? 'border-b-2 border-brand-orange' : 'text-gray-400'}`}>Mystery Box</button>
                <button onClick={() => setTab('product')} className={`px-4 py-2 text-lg ${tab === 'product' ? 'border-b-2 border-brand-orange' : 'text-gray-400'}`}>Produk</button>
            </div>
            
             <div className="overflow-x-auto bg-gray-800 rounded-md">
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-600"><th className="p-3">User</th><th className="p-3">Item</th><th className="p-3">Tanggal</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
                    <tbody>
                        {purchasesToShow.map(p => (
                            <tr key={p.id} className="border-b border-gray-700">
                                <td className="p-3">{getUserNickname(p.userId)}</td>
                                <td className="p-3">{p.productName}{p.prize && <span className="text-xs text-yellow-400 ml-2">({p.prize})</span>}</td>
                                <td className="p-3">{new Date(p.timestamp).toLocaleString('id-ID')}</td>
                                <td className={`p-3 capitalize font-semibold ${p.status === 'success' ? 'text-green-400' : p.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{p.status}</td>
                                <td className="p-3 space-x-2">
                                    {p.status === 'pending' && <>
                                        <button onClick={() => handleUpdateStatus(p, 'success')} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm">Terima</button>
                                        <button onClick={() => handleUpdateStatus(p, 'rejected')} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Tolak</button>
                                    </>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};

// Sub-component: ManageLeaderboard
const ManageLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    useEffect(() => {
        const unsubscribe = listenToLeaderboard(setLeaderboard);
        return () => unsubscribe();
    }, []);
    return  <div className="overflow-x-auto bg-gray-800 rounded-md">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-600">
                    <th className="p-3">#</th>
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Total Kemenangan</th>
                    <th className="p-3">Item yang Didapat</th>
                    <th className="p-3">Terakhir Aktif</th>
                </tr>
            </thead>
            <tbody>
                {leaderboard.map((l) => (
                    <tr key={l.uid} className="border-b border-gray-700">
                        <td className="p-3">{l.rank}</td>
                        <td className="p-3">{l.nickname} <span className="text-gray-400 text-sm">({l.email})</span></td>
                        <td className="p-3">{l.itemsObtained}</td>
                        <td className="p-3 text-xs">{l.obtainedItems.join(', ')}</td>
                        <td className="p-3">{new Date(l.lastLogin).toLocaleString('id-ID')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>;
};

// Sub-component: ManageMessages
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

// Sub-component: ManageReviews
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
};

// Sub-component: ManageButtons
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
};


// Main AdminView Component
interface AdminViewProps {
    activePage: AdminPage;
}

const AdminView: React.FC<AdminViewProps> = ({ activePage }) => {
  const pageTitle = adminMenuItems.find(item => item.id === activePage)?.name || 'Admin Panel';

  const renderContent = () => {
      switch (activePage) {
          case 'dashboard': return <AdminDashboard />;
          case 'products': return <ManageProducts />;
          case 'users': return <ManageUsers />;
          case 'purchases': return <ManagePurchases />;
          case 'leaderboard': return <ManageLeaderboard />;
          case 'messages': return <ManageMessages />;
          case 'reviews': return <ManageReviews />;
          case 'buttons': return <ManageButtons />;
          default: return <AdminDashboard />;
      }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold mb-6 capitalize">{pageTitle}</h1>
        <div className="animate-fade-in">
            {renderContent()}
        </div>
    </div>
  );
};

export default AdminView;
