import React, { useState, useEffect } from 'react';
import type { PurchaseHistoryItem, User } from '../../types';
import { listenToUserPurchaseHistory, listenToUsers, updatePurchaseStatus } from '../../services/firebase';
import Modal from '../../components/common/Modal';

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
}

export default ManagePurchases;