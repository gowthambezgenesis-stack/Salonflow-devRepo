import React from 'react';
import { Tag, ChevronRight } from 'lucide-react';
import { Offer } from '../types';

interface ExclusiveOffersProps {
  offers: Offer[];
  onBookClick: (offer: Offer) => void;
}

const ExclusiveOffers: React.FC<ExclusiveOffersProps> = ({ offers, onBookClick }) => {
  const activeOffers = offers.filter(o => o.active);

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-pink-600 dark:text-pink-400" /> Exclusive Offers
      </h2>
      {activeOffers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOffers.map(offer => (
            <div key={offer.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-pink-100 dark:border-gray-700 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-700 transition-all group">
              <span className="bg-pink-600 dark:bg-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
                {offer.discount_percentage}% OFF
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mt-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{offer.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed line-clamp-2">{offer.description}</p>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Valid until {new Date(offer.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                <button onClick={() => onBookClick(offer)} className="text-sm font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1">
                  Book <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Check back later for new exciting offers!</p>
        </div>
      )}
    </div>
  );
};

export default ExclusiveOffers;

