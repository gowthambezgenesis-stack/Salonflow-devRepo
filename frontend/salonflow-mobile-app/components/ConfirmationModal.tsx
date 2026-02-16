import React from 'react';
import { X, CheckCircle2, Tag, ChevronDown } from 'lucide-react';
import { Service, Offer, SalonProfile } from '../types';

interface ConfirmationModalProps {
  show: boolean;
  selectedService: Service | null;
  selectedSlot: string | null;
  selectedDate: Date;
  selectedOffer: Offer | null;
  offers: Offer[];
  salonProfile: SalonProfile;
  bookingNotes: string;
  onClose: () => void;
  onConfirm: () => void;
  onNotesChange: (notes: string) => void;
  onOfferChange: (offer: Offer | null) => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  selectedService,
  selectedSlot,
  selectedDate,
  selectedOffer,
  offers,
  salonProfile,
  bookingNotes,
  onClose,
  onConfirm,
  onNotesChange,
  onOfferChange
}) => {
  if (!show || !selectedService || !selectedSlot) return null;

  const dateStr = selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  const applicableOffer = selectedOffer && selectedOffer.active && new Date(selectedOffer.valid_until) > new Date()
    ? selectedOffer
    : undefined;

  let finalPrice = selectedService.price;
  let discountAmount = 0;

  if (applicableOffer) {
    discountAmount = selectedService.price * (applicableOffer.discount_percentage / 100);
    finalPrice = selectedService.price - discountAmount;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Booking</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Service</span>
            <span className="font-bold text-gray-900 dark:text-white text-right">{selectedService.name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Date & Time</span>
            <div className="text-right">
              <div className="font-bold text-gray-900 dark:text-white">{dateStr}</div>
              <div className="text-sm text-pink-600 dark:text-pink-400 font-medium">{selectedSlot}</div>
            </div>
          </div>
          <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Location</span>
            <span className="font-medium text-gray-900 dark:text-white text-right text-sm max-w-[180px]">{salonProfile.name}</span>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Add Notes (Optional)
            </label>
            <textarea
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none resize-none dark:text-white"
              rows={3}
              placeholder="Styling preferences, allergies, or specific requests..."
              value={bookingNotes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>

          <div className="bg-pink-50 dark:bg-gray-700/50 p-4 rounded-xl mt-2 border border-pink-100 dark:border-gray-600">
            {applicableOffer && (
              <div className="mb-2 pb-2 border-b border-pink-200 dark:border-gray-600 space-y-1">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-300">
                  <span>Original Price</span>
                  <span className="line-through">₹{selectedService.price}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-green-600 dark:text-green-400">
                  <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {applicableOffer.title}</span>
                  <span>-₹{Math.round(discountAmount)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-pink-900 dark:text-pink-200 text-sm font-bold">Total to Pay</span>
              <span className="font-bold text-pink-600 dark:text-pink-400 text-2xl">₹{Math.round(finalPrice)}</span>
            </div>
          </div>
        </div>

        {offers.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Apply Offer (Optional)
            </label>
            <div className="relative">
              <select
                className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer text-gray-900 dark:text-white pr-10"
                value={selectedOffer?.id?.toString() || ''}
                onChange={(e) => {
                  const offerId = e.target.value;
                  if (offerId === '') {
                    onOfferChange(null);
                  } else {
                    const offer = offers.find(o => o.id?.toString() === offerId);
                    onOfferChange(offer || null);
                  }
                }}
              >
                <option value="">No Offer</option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id?.toString()}>
                    {offer.title} - {offer.discount_percentage}% off
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        <button
          onClick={onConfirm}
          className="w-full py-4 rounded-xl font-bold text-white bg-gray-900 dark:bg-pink-600 hover:bg-gray-800 dark:hover:bg-pink-700 shadow-xl hover:shadow-2xl transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Confirm & Book <CheckCircle2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;

