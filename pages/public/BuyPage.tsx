import React, { useState, useEffect } from 'react';
import type { Product, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listenToProducts, listenToReviews } from '../../services/firebase';
import ProductCard from '../../components/ui/ProductCard';

interface BuyPageProps {
  onProductPurchase: (product: Product) => void;
}

const BuyPage: React.FC<BuyPageProps> = ({ onProductPurchase }) => {
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

export default BuyPage;