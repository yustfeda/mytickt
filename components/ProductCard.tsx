import React from 'react';
import type { Product, User } from '../types';

interface ProductCardProps {
  product: Product;
  onPurchaseClick: (product: Product) => void;
}

const StockProgressBar: React.FC<{ stock: number; maxStock: number }> = ({ stock, maxStock }) => {
    const safeMaxStock = maxStock > 0 ? maxStock : 1;
    const itemsSold = safeMaxStock - stock;
    const percentageSold = Math.min(100, Math.max(0, (itemsSold / safeMaxStock) * 100));

    const stockPercentage = (stock / safeMaxStock) * 100;
    let barColor = 'bg-red-500';
    if (stockPercentage > 50) barColor = 'bg-green-500';
    else if (stockPercentage > 20) barColor = 'bg-yellow-500';
    
    return (
        <div className="mt-auto mb-3">
            <div className="text-right text-xs text-gray-400 mb-1">
                Stok: {stock}/{maxStock}
            </div>
            <div className="w-full bg-white rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percentageSold}%` }}
                ></div>
            </div>
        </div>
    );
};


const ProductCard: React.FC<ProductCardProps> = ({ product, onPurchaseClick }) => {
    
  const handleBuy = () => {
    if (product.stock > 0) {
      onPurchaseClick(product);
    }
  };

  const isAvailable = product.isActive && product.stock > 0;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-300 group flex flex-col">
      <div className="relative">
        <img 
          src={product.imageUrl || 'https://picsum.photos/400/300'}
          alt={product.name} 
          className="w-full h-48 object-cover"
          onError={(e) => { e.currentTarget.src = 'https://picsum.photos/400/300'; }}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
        <p className="text-sm text-gray-400">{product.category}</p>
        <p className="text-brand-orange font-bold mt-1">Rp {product.price.toLocaleString('id-ID')}</p>
        <p className="text-gray-400 text-sm mt-2 flex-grow min-h-[40px]">{product.description}</p>
        
        {product.isActive && <StockProgressBar stock={product.stock} maxStock={product.maxStock} />}
        
        {!product.isActive && <p className="text-center text-yellow-400 font-semibold my-4">Stok belum tersedia</p>}
        
        <button
          onClick={handleBuy}
          disabled={!isAvailable}
          className={`w-full mt-2 py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300 flex items-center justify-center gap-2
            ${isAvailable 
              ? 'bg-brand-orange hover:bg-orange-500' 
              : !product.isActive 
              ? 'bg-yellow-600 cursor-not-allowed text-yellow-100'
              : 'bg-gray-600 cursor-not-allowed'
            }
          `}
        >
          {!product.isActive ? <><i className="fas fa-clock"></i> Belum Tersedia</> : isAvailable ? 'Beli Sekarang' : 'Stok Habis'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;