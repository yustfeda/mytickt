import React, { useState, useEffect } from 'react';
import type { Product, Review } from '../../types';
import { listenToProducts, listenToReviews } from '../../services/firebase';

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

export default AdminDashboard;
