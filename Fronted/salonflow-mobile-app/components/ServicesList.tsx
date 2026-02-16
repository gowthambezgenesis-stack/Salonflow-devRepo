import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Edit2, Trash2, Clock, DollarSign, FileText, X } from 'lucide-react';
import apiClient from '../services/api';

interface ServicesListProps {
  services: Service[];
  onAddService: (service: Service) => void;
  onUpdateService: (service: Service) => void;
  onDeleteService: (id: string) => void;
}

const ServicesList: React.FC<ServicesListProps> = ({ services, onAddService, onUpdateService, onDeleteService }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    duration_minutes: 30,
    price: 0,
    description: ''
  });

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ name: '', duration_minutes: 30, price: 0, description: '' });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({ ...service });
    setError(null);
    setIsModalOpen(true);
  };

  const mapBackendService = (service: any): Service => ({
    id: service.id?.toString(),
    name: service.name,
    duration_minutes: service.duration_minutes,
    price: service.price,
    description: service.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price == null || formData.duration_minutes == null) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingService) {

        const serviceId = parseInt(editingService.id, 10);
        const response = await apiClient.patch(`/api/store/services/${serviceId}/`, {
          name: formData.name,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          description: formData.description || '',
        });
        const updated = mapBackendService(response.data);
        onUpdateService(updated);
      } else {

        const response = await apiClient.post('/api/store/services/', {
          name: formData.name,
          duration_minutes: (formData.duration_minutes as number),
          price: (formData.price as number),
          description: formData.description || '',
        });
        const created = mapBackendService(response.data);
        onAddService(created);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving service:', err);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        'Failed to save service. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (service: Service, e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);

    try {
      const serviceId = parseInt(service.id, 10);
      await apiClient.delete(`/api/store/services/${serviceId}/`);
      onDeleteService(service.id);
    } catch (err: any) {
      console.error('Error deleting service:', err);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        'Failed to delete service. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services Management</h1>
        <button
          onClick={openAddModal}
          className="bg-pink-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-700 transition-colors flex items-center gap-2 font-bold text-sm"
        >
          <Plus className="h-5 w-5" /> Add Service
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div
            key={service.id}
            onClick={() => openEditModal(service)}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-pink-200 dark:hover:border-pink-800 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {service.name}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400 group-hover:bg-pink-50 dark:group-hover:bg-pink-900/20 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                <Edit2 className="h-4 w-4" />
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
              {service.description || "No description provided."}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium">
                  <Clock className="h-3.5 w-3.5 text-gray-400" /> {service.duration_minutes}m
                </span>
                <span className="flex items-center gap-1 text-gray-900 dark:text-white font-bold">
                  <span className="text-gray-400 font-normal">₹</span>{service.price}
                </span>
              </div>
              <button
                onClick={(e) => handleDelete(service, e)}
                className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Service"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg p-6 rounded-t-3xl sm:rounded-2xl animate-slide-up border border-gray-100 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Service Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Haircut"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Price (₹)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                      placeholder="300"
                      value={formData.price || ''}
                      onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Duration (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                      placeholder="30"
                      value={formData.duration_minutes || ''}
                      onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    rows={3}
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-all"
                    placeholder="Details about the service..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? (editingService ? 'Saving...' : 'Adding...')
                    : (editingService ? 'Save Changes' : 'Add Service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesList;
