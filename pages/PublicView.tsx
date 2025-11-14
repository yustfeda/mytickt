import React, { useState, useEffect, useRef } from 'react';
import type { PurchaseHistoryItem, Page, Product, Review, LeaderboardEntry, PrivateMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
    listenToUserPurchaseHistory, 
    createPurchaseHistory,
    listenToProducts,
    listenToReviews,
    listenToLeaderboard,
    deletePurchaseHistoryItem,
    openMysteryBox,
    listenToUserMessages,
    markMessageAsRead
} from '../services/firebase';
import UserWelcomeDashboard from '../components/ui/UserWelcomeDashboard';
import ProductCard from '../components/ui/ProductCard';
import Modal from '../components/common/Modal';

// Sub-component for the main "Buy" page
const BuyPage: React.FC<{ onProductPurchase: (product: Product) => void; }> = ({ onProductPurchase }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        const unsubscribeProducts = listenToProducts(setProducts);
        const unsubscribeReviews = listenToReviews(setReviews);
        return () => {
            unsubscribeProducts();
            unsubscribeReviews();
        };
    }, []);

    return (
        <div className="animate-fade-in space-y-16">
            {!user && <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                Selamat Datang di <span className="text-brand-blue">TOKO</span><span className="text-brand-orange">aing</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Temukan produk-produk menarik dan ulasan dari pelanggan kami.
                </p>
            </div>}
            
            <div>
                <h2 className="text-3xl font-bold mb-6 text-center">Produk Kami</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(p => <ProductCard key={p.id} product={p} onPurchaseClick={onProductPurchase} />)}
                </div>
                {products.length === 0 && <p className="text-center text-gray-500">Belum ada produk yang tersedia.</p>}
            </div>

            {!user && <div>
                <h2 className="text-3xl font-bold mb-6 text-center">Ulasan Pelanggan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <p className="text-gray-300 mb-4">"{review.text}"</p>
                            <p className="font-semibold text-brand-orange text-right">- {review.author}</p>
                        </div>
                    ))}
                </div>
                {reviews.length === 0 && <p className="text-center text-gray-500">Belum ada ulasan.</p>}
            </div>}
        </div>
    );
};

// Sub-component for the Leaderboard page
const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    
    useEffect(() => {
        const unsubscribe = listenToLeaderboard(setLeaderboard);
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-gray-800 p-4 sm:p-8 rounded-lg shadow-2xl animate-fade-in max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 text-brand-orange">Papan Peringkat Pemenang</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-2 sm:p-4">#</th>
                            <th className="p-2 sm:p-4">Pengguna</th>
                            <th className="p-2 sm:p-4 text-center">Total Kemenangan</th>
                            <th className="p-2 sm:p-4">Item yang Didapat</th>
                            <th className="p-2 sm:p-4">Terakhir Aktif</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry) => (
                            <tr key={entry.uid} className="border-b border-gray-600 hover:bg-gray-700/50">
                                <td className="p-2 sm:p-4 font-bold text-lg">{entry.rank}</td>
                                <td className="p-2 sm:p-4">
                                    <div>{entry.nickname}</div>
                                    <div className="text-xs text-gray-400">{entry.email}</div>
                                </td>
                                <td className="p-2 sm:p-4 text-center font-semibold text-green-400">{entry.itemsObtained}</td>
                                <td className="p-2 sm:p-4 text-xs text-gray-400">
                                    {entry.obtainedItems.join(', ')}
                                </td>
                                <td className="p-2 sm:p-4 text-xs text-gray-400">{new Date(entry.lastLogin).toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leaderboard.length === 0 && <p className="text-center py-4">Papan peringkat kosong. Jadilah pemenang pertama!</p>}
            </div>
        </div>
    );
};

// Sub-component for the History page
const HistoryPage: React.FC<{ userHistory: PurchaseHistoryItem[]; setNotification: (message: string) => void;}> = ({ userHistory, setNotification }) => {
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
};

// Sub-component for the MysteryBox page
const MysteryBoxPage: React.FC<{ setNotification: (message: string) => void; onLoginClick: () => void; }> = ({ setNotification, onLoginClick }) => {
    const { user } = useAuth();
    const [isMbLoading, setIsMbLoading] = useState(false);
    const MYSTERY_BOX_URL = 'https://lynk.id/yustdan/gmz9dn1dk1ek/checkout';

    const handleMysteryBoxPurchase = async () => {
        if (!user) {
            onLoginClick();
            return;
        }

        if (isMbLoading) return;

        setIsMbLoading(true);

        try {
            await createPurchaseHistory(user.uid, { type: 'mysterybox', productName: 'Mystery Box' });
            // The purchase is now created in the DB.
            // Open the checkout URL in a new tab. This is more reliable than navigating the current window,
            // as it prevents the React app from unmounting prematurely and causing a "blank page".
            window.open(MYSTERY_BOX_URL, '_blank');
        } catch (error) {
            console.error("Mystery Box purchase error:", error);
            setNotification('Gagal membuat pesanan Mystery Box. Coba lagi.');
        } finally {
            // Always reset the loading state, whether it succeeded or failed.
            setIsMbLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl animate-fade-in max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-center mb-4 text-brand-orange">Mystery Box</h2>
            <p className="text-lg text-gray-300 mb-6">Dapatkan hadiah kejutan! Total pembelian Anda: {user?.mysteryBoxAttempts || 0} kali.</p>
            {/* Changed from <a> to <button> for semantic correctness and to implement a more reliable flow. */}
            <button 
                onClick={handleMysteryBoxPurchase}
                className={`inline-block text-center w-full bg-brand-blue px-8 py-3 rounded-md text-white font-bold hover:bg-blue-500 transition-colors ${isMbLoading ? 'bg-gray-500 cursor-not-allowed' : ''}`}
                disabled={isMbLoading}
            >
                {isMbLoading ? 'Memproses...' : 'Beli Mysterybox'}
            </button>
        </div>
    );
};

// Sub-component for the Messages page
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


// Main PublicView Component
interface PublicViewProps {
  setNotification: (message: string) => void;
  onLoginClick: () => void;
  currentPage: Omit<Page, 'admin'>;
}

const PublicView: React.FC<PublicViewProps> = ({ setNotification, onLoginClick, currentPage }) => {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const prevHistoryRef = useRef<PurchaseHistoryItem[]>([]);
  const [paymentModalProduct, setPaymentModalProduct] = useState<Product | null>(null);


  useEffect(() => {
      if (!user) {
          setHistory([]);
          prevHistoryRef.current = [];
          return;
      }
      
      const unsubHistory = listenToUserPurchaseHistory(user.uid, (newHistory) => {
          const prevHistory = prevHistoryRef.current;
          if (prevHistory && prevHistory.length > 0 && newHistory.length > 0) {
              newHistory.forEach(newItem => {
                  const oldItem = prevHistory.find(old => old.id === newItem.id);
                  if (oldItem && oldItem.status === 'pending' && newItem.status !== 'pending') {
                       if (newItem.status === 'success') setNotification(`Pesanan "${newItem.productName}" telah diterima!`);
                       else if (newItem.status === 'rejected') setNotification(`Pesanan "${newItem.productName}" ditolak.`);
                  }
              });
          }
          setHistory(newHistory);
          prevHistoryRef.current = newHistory;
      });

      return () => { 
        unsubHistory();
      };
  }, [user, setNotification]);
  
  const handleProductPurchase = async (product: Product) => {
      if (!user) {
        onLoginClick();
        return;
      }
      try {
        await createPurchaseHistory(user.uid, {
            type: 'product',
            productName: product.name,
            productId: product.id,
        });
        setPaymentModalProduct(product);
      } catch (e) {
        setNotification('Gagal membuat pesanan. Coba lagi.');
      }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'history':
        return user ? <HistoryPage userHistory={history} setNotification={setNotification} /> : <BuyPage onProductPurchase={handleProductPurchase} />;
      case 'mysterybox':
        return user ? <MysteryBoxPage setNotification={setNotification} onLoginClick={onLoginClick} /> : <BuyPage onProductPurchase={handleProductPurchase} />;
      case 'messages':
        return user ? <MessagesPage /> : <BuyPage onProductPurchase={handleProductPurchase} />;
      case 'home':
      default:
        return <BuyPage onProductPurchase={handleProductPurchase} />;
    }
  };
   

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-orange"></div></div>;
  }

  const pendingCount = history.filter(h => h.status === 'pending').length;

  return (
    <>
      {paymentModalProduct && (
        <Modal 
          isOpen={true} 
          onClose={() => setPaymentModalProduct(null)} 
          title="Lanjutkan Pembayaran"
        >
          <div className="text-center">
            <p className="text-gray-300 mb-6">
              Pesanan Anda untuk "{paymentModalProduct.name}" telah berhasil dicatat. 
              Silakan selesaikan pembayaran Anda.
            </p>
            <a
              href={paymentModalProduct.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-500 transition-colors"
              onClick={() => setPaymentModalProduct(null)} // Close modal when link is clicked
            >
              Bayar Sekarang
            </a>
            <p className="text-xs text-gray-500 mt-4">
              Anda akan diarahkan ke halaman pembayaran. Setelah membayar, kirim bukti di halaman Riwayat.
            </p>
          </div>
        </Modal>
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user && <UserWelcomeDashboard user={user} pendingCount={pendingCount} />}
        {renderContent()}
      </div>
    </>
  );
};

export default PublicView;