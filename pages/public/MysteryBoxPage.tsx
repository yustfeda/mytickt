import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPurchaseHistory } from '../../services/firebase';

interface MysteryBoxPageProps {
  setNotification: (message: string) => void;
  onLoginClick: () => void;
}

const MYSTERY_BOX_URL = 'https://lynk.id/yustdan/gmz9dn1dk1ek/checkout';

const MysteryBoxPage: React.FC<MysteryBoxPageProps> = ({ setNotification, onLoginClick }) => {
    const { user } = useAuth();
    const [isMbLoading, setIsMbLoading] = useState(false);

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

export default MysteryBoxPage;