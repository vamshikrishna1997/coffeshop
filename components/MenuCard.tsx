
import React from 'react';
import { MenuItem } from '../types';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-sm font-semibold text-amber-900">
          ${item.price.toFixed(2)}
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-stone-800">{item.name}</h3>
          <span className="text-xs uppercase tracking-wider text-stone-400 font-bold">{item.category}</span>
        </div>
        <p className="text-stone-500 text-sm line-clamp-2 mb-4 leading-relaxed">
          {item.description}
        </p>
        <button 
          onClick={() => onAddToCart(item)}
          className="w-full bg-stone-900 text-white py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Add to Order
        </button>
      </div>
    </div>
  );
};

export default MenuCard;
