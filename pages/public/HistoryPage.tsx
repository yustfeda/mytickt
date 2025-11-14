import React, { useState } from 'react';
import type { PurchaseHistoryItem } from '../../types';
import { deletePurchaseHistoryItem, openMysteryBox } from '../../services/firebase';
import Modal from '../../components/common/Modal';

interface HistoryPageProps {
    userHistory: PurchaseHistoryItem[];
    setNotification: (message: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ userHistory, setNotification }) => {
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState<PurchaseHistoryItem | null>(null);

    const handleDelete = async (id: string) => {
        await deletePurchaseHistoryItem(id);
        setDeleteConfirm(null);
        setNotification('Riwayat berhasil dihapus.');
    }

    const handleCancel = async (item: PurchaseHistoryItem) => {
        await deletePurchaseHistoryItem(item.id);
        setCancelConfirm(null);
        setNotification(`Pesanan "${item.productName}" telah dibatalkan.`);
    }
    
    const handleOpenBox = async (item: PurchaseHistoryItem) => {
        if (item.prize) {
            setNotification(`Selamat! Anda Memenangkan: ${item.prize}! Silakan hubungi admin.`);
        } else {
            setNotification("Yah, coba lagi nanti ya!");
        }
        await openMysteryBox(item.id);
    };

    const getStatusChip = (status: PurchaseHistoryItem['status']) => {
        const base = 'px-3 py-1 text-xs font-semibold rounded-full';
        switch(status) {
            case 'success': return `${base} bg-green-500/20 text-green-300`;
            case 'pending': return `${base} bg-yellow-500/20 text-yellow-300`;
            case 'rejected': return `${base} bg-red-500/20 text-red-300`;
        }
    }

    const renderAction = (item: PurchaseHistoryItem) => {
        if (item.status === 'pending') {
            return (
                <div className="flex items-center gap-2">
                    <a href="https://wa.me/6285817938860?text=Halo%2C%20saya%20ingin%20mengirim%20bukti%20pembayaran." 
                       target="_blank" rel="noopener noreferrer"
                       className="bg-green-600 text-white px-3 py-1 text-sm rounded-md hover:bg-green-500 whitespace-nowrap">
                       Kirim Bukti
                    </a>
                    {item.type === 'product' && (
                        <button onClick={() => setCancelConfirm(item)} className="bg-red-600 text-white px-3 py-1 text-sm rounded-md hover:bg-red-500">
                           Batalkan
                        </button>
                    )}
                </div>
            );
        }
        if (item.type === 'mysterybox' && item.status === 'success' && !item.isOpened) {
            return <button onClick={() => handleOpenBox(item)} className="bg-brand-orange text-white px-3 py-1 text-sm rounded-md hover:bg-orange-500">Buka Box</button>
        }
        return <button onClick={() => setDeleteConfirm(item.id)} className="text-red-500 hover:text-red-400"><i className="fas fa-trash"></i></button>;
    };

    return <>
        {deleteConfirm && <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus">
            <p>Anda yakin ingin menghapus riwayat ini?</p>
            <div className="flex justify-end gap-4 mt-4">
                <button onClick={() => setDeleteConfirm(null)} className="py-2 px-4 rounded-md bg-gray-600">Tidak</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="py-2 px-4 rounded-md bg-red-600">Ya, Hapus</button>
            </div>
        </Modal>}
        {cancelConfirm && <Modal isOpen={true} onClose={() => setCancelConfirm(null)} title="Konfirmasi Pembatalan">
            <p>Anda yakin ingin membatalkan pesanan "{cancelConfirm.productName}"?</p>
            <div className="flex justify-end gap-4 mt-4">
                <button onClick={() => setCancelConfirm(null)} className="py-2 px-4 rounded-md bg-gray-600">Tidak</button>
                <button onClick={() => handleCancel(cancelConfirm)} className="py-2 px-4 rounded-md bg-red-600">Ya, Batalkan</button>
            </div>
        </Modal>}
        <div className="bg-gray-800 p-4 sm:p-8 rounded-lg shadow-2xl animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 text-brand-orange">Riwayat Pembelian</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr className="border-b border-gray-700"><th className="p-2 sm:p-4">Produk</th><th className="p-2 sm:p-4">Tanggal</th><th className="p-2 sm:p-4">Status</th><th className="p-2 sm:p-4">Aksi</th></tr></thead>
                    <tbody>
                        {userHistory.map((item) => (
                            <tr key={item.id} className="border-b border-gray-600 hover:bg-gray-700/50">
                                <td className="p-2 sm:p-4">{item.productName}</td>
                                <td className="p-2 sm:p-4 text-sm">{new Date(item.timestamp).toLocaleString('id-ID')}</td>
                                <td className="p-2 sm:p-4"><span className={getStatusChip(item.status)}>{item.status}</span></td>
                                <td className="p-2 sm:p-4">{renderAction(item)}</td>
                            </tr>
                        ))}
                        {userHistory.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-gray-500">Anda belum memiliki riwayat pembelian.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    </>
}

export default HistoryPage;