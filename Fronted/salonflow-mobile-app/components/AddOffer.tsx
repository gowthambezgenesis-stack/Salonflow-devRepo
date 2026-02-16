import React, { useState } from 'react';
import { Offer } from '../types';
import { Loader2, X } from 'lucide-react';
import apiClient from '../services/api';

interface AddOfferProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (offer: Offer) => void;
}


const AddOffer: React.FC<AddOfferProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState<Partial<Offer>>({
    title: '',
    description: '',
    discount_percentage: 0,
    valid_until: '',
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffer.title || !newOffer.discount_percentage || !newOffer.valid_until) return;

    setIsLoading(true);
    setError(null);

    try {

      const validUntilDate = newOffer.valid_until || '';


      const offerData = {
        title: newOffer.title.trim(),
        description: newOffer.description?.trim() || '',
        discount_percentage: parseFloat(newOffer.discount_percentage.toString()),
        valid_until: validUntilDate,
        valid_from: new Date().toISOString()
      };

      const response = await apiClient.post('/api/store/offers/create/', offerData);

      const createdOffer: Offer = {
        id: response.data.id,
        title: response.data.title,
        description: response.data.description || '',
        discount_percentage: parseFloat(response.data.discount_percentage),
        valid_until: response.data.valid_until,
        valid_from: response.data.valid_from,
        active: true
      };

      onSuccess(createdOffer);


      handleClose();
    } catch (err: any) {
      console.error('Error creating offer:', err);

      let errorMessage = 'Failed to create offer. Please try again.';
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'object') {

          const fieldErrors = Object.entries(err.response.data)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msg}`;
            })
            .join('; ');
          errorMessage = fieldErrors || errorMessage;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setNewOffer({ title: '', description: '', discount_percentage: 0, valid_until: '', active: true });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-6 rounded-t-3xl sm:rounded-2xl animate-slide-up border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Offer</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              type="text"
              className="w-full bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none mt-1 placeholder-gray-400"
              placeholder="e.g. Weekend Blast"
              value={newOffer.title}
              onChange={e => setNewOffer({...newOffer, title: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Discount %
              </label>
              <input
                type="number"
                className="w-full bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none mt-1 placeholder-gray-400"
                placeholder="20"
                value={newOffer.discount_percentage || ''}
                min="0"
                max="100"
                step="0.01"
                onChange={e => {
                  const value = e.target.value;
                  setNewOffer({...newOffer, discount_percentage: value ? parseFloat(value) : 0});
                }}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Valid Until
              </label>
              <input
                type="date"
                className="w-full bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none mt-1"
                value={newOffer.valid_until || ''}
                onChange={e => setNewOffer({...newOffer, valid_until: e.target.value})}
                required
                disabled={isLoading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none mt-1 resize-none placeholder-gray-400"
              placeholder="Details about the offer..."
              value={newOffer.description}
              onChange={e => setNewOffer({...newOffer, description: e.target.value})}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Publish Offer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOffer;
