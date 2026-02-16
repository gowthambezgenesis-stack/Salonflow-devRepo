import React, { useState, useMemo } from 'react';
import { Offer } from '../types';
import { Plus, Trash2, Sparkles, Clock, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';
import AddOffer from './AddOffer';

interface OffersListProps {
  offers: Offer[];
  onAddOffer?: (offer: Offer) => void;
  onDeleteOffer?: (id: string | number) => void;
  readOnly?: boolean;
  title?: string;
  emptyStateMessage?: string;
}


const OffersList: React.FC<OffersListProps> = ({
  offers,
  onAddOffer,
  onDeleteOffer,
  readOnly = false,
  title = "Your Offers",
  emptyStateMessage
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeOffers, expiredOffers } = useMemo(() => {
    if (readOnly) {
      const active = offers.filter(o => {
        if (!o.active) return false;
        const validUntilDate = new Date(o.valid_until);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        validUntilDate.setHours(0, 0, 0, 0);
        return validUntilDate >= today;
      });
      return { activeOffers: active, expiredOffers: [] };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const active: Offer[] = [];
      const expired: Offer[] = [];
      
      offers.forEach(offer => {
        const validUntilDate = new Date(offer.valid_until);
        validUntilDate.setHours(0, 0, 0, 0);
        
        if (validUntilDate < today) {
          expired.push(offer);
        } else {
          active.push(offer);
        }
      });
      
      return { activeOffers: active, expiredOffers: expired };
    }
  }, [offers, readOnly]);

  const displayOffers = readOnly ? activeOffers : activeOffers;

  const handleAddOfferSuccess = (offer: Offer) => {
    if (onAddOffer) {
      onAddOffer(offer);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {!readOnly && onAddOffer && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-pink-600 text-white p-2 rounded-full shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Offers Section */}
      {!readOnly && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Offers</h2>
            {activeOffers.length > 0 && (
              <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-xs font-bold px-2 py-1 rounded-full">
                {activeOffers.length}
              </span>
            )}
          </div>

          {activeOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-pink-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Active Offers</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
                Create your first offer to attract more customers and boost bookings.
              </p>
              {onAddOffer && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-pink-600 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-pink-700 transition-colors"
                >
                  Create Offer
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activeOffers.map(offer => (
                <OfferCard
                  key={offer.id || `offer-${Math.random()}`}
                  offer={offer}
                  readOnly={readOnly}
                  onDeleteOffer={onDeleteOffer}
                  setError={setError}
                  isExpired={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer View - Only Active Offers */}
      {readOnly && (
        <>
          {displayOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-20 h-20 bg-pink-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Active Offers</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
                {emptyStateMessage || "Check back later for exciting offers and discounts!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayOffers.map(offer => (
                <OfferCard
                  key={offer.id || `offer-${Math.random()}`}
                  offer={offer}
                  readOnly={readOnly}
                  onDeleteOffer={onDeleteOffer}
                  setError={setError}
                  isExpired={false}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Expired Offers Section (Owner Only) */}
      {!readOnly && expiredOffers.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4 px-2">
            <AlertCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400">Expired Offers</h2>
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full">
              {expiredOffers.length}
            </span>
          </div>

          <div className="space-y-4">
            {expiredOffers.map(offer => (
              <OfferCard
                key={offer.id || `expired-offer-${Math.random()}`}
                offer={offer}
                readOnly={readOnly}
                onDeleteOffer={onDeleteOffer}
                setError={setError}
                isExpired={true}
              />
            ))}
          </div>
        </div>
      )}


      {!readOnly && onAddOffer && (
        <AddOffer
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAddOfferSuccess}
        />
      )}
    </div>
  );
};

// Offer Card Component
interface OfferCardProps {
  offer: Offer;
  readOnly: boolean;
  onDeleteOffer?: (id: string | number) => void;
  setError: (error: string | null) => void;
  isExpired: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  readOnly,
  onDeleteOffer,
  setError,
  isExpired
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border relative overflow-hidden transition-colors duration-200 ${
        isExpired
          ? 'border-gray-200 dark:border-gray-700 opacity-75'
          : 'border-gray-100 dark:border-gray-700'
      } ${
        readOnly ? 'hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-700 cursor-pointer' : ''
      }`}
      onClick={readOnly ? () => {} : undefined}
    >
      {isExpired ? (
        <div className="absolute top-0 right-0 bg-gray-400 dark:bg-gray-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
          <Clock className="h-3 w-3" />
          EXPIRED
        </div>
      ) : (
        <div className="absolute top-0 right-0 bg-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
          {offer.discount_percentage}% OFF
        </div>
      )}

      <h3 className={`font-bold text-gray-900 dark:text-white ${readOnly ? 'pr-12' : 'pr-8'} ${isExpired ? 'line-through opacity-60' : ''}`}>
        {offer.title}
      </h3>
      <p className={`text-sm mt-1 line-clamp-2 ${isExpired ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
        {offer.description}
      </p>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
        <div className={`text-xs flex items-center gap-1 ${isExpired ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400'}`}>
          <Clock className="h-3 w-3" />
          <span>
            {isExpired ? 'Expired on' : 'Valid until'}: {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A'}
          </span>
        </div>
        {!readOnly && onDeleteOffer && (
          <button
            onClick={async () => {
              if (offer.id) {
                const offerId = typeof offer.id === 'number' ? offer.id : parseInt(offer.id);
                try {
                  await apiClient.delete(`/api/store/offers/${offerId}/delete/`);
                  onDeleteOffer(offerId);
                } catch (err: any) {
                  console.error('Error deleting offer:', err);
                  const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to delete offer. Please try again.';
                  setError(errorMsg);
                }
              }
            }}
            className="text-red-500 p-2 -mr-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Delete offer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default OffersList;
