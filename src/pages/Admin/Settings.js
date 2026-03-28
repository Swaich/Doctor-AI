import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiSave } from 'react-icons/fi';


const Settings = () => {
  const [settings, setSettings] = useState({
    creditPricing: 10,
    consultationLimit: 5,
    platformFeePercentage: 10,
    refundPolicy: '',
    termsAndConditions: '',
    notificationMessage: ''
  });
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      await api.post('/categories', { name: newCategory });
      toast.success('Category added successfully');
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-secondary-600">Loading...</span>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="h-full overflow-hidden flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Content & Settings Management</h1>
          <p className="text-secondary-600">Configure platform settings and manage categories</p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100 space-y-8 pr-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Global App Settings</h2>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="form-label">Credit Pricing (₹ per Credit)</label>
                  <input
                    type="number"
                    value={settings.creditPricing}
                    onChange={(e) => setSettings({ ...settings, creditPricing: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Daily Consultation Limit</label>
                  <input
                    type="number"
                    value={settings.consultationLimit}
                    onChange={(e) => setSettings({ ...settings, consultationLimit: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Platform Fee (%)</label>
                  <input
                    type="number"
                    value={settings.platformFeePercentage}
                    onChange={(e) => setSettings({ ...settings, platformFeePercentage: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Refund Policy</label>
                <textarea
                  rows="4"
                  value={settings.refundPolicy}
                  onChange={(e) => setSettings({ ...settings, refundPolicy: e.target.value })}
                  className="form-input"
                  placeholder="Enter your refund policy..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Terms & Conditions</label>
                <textarea
                  rows="6"
                  value={settings.termsAndConditions}
                  onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                  className="form-input"
                  placeholder="Enter terms and conditions..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Push Notification Message</label>
                <textarea
                  rows="3"
                  value={settings.notificationMessage}
                  onChange={(e) => setSettings({ ...settings, notificationMessage: e.target.value })}
                  className="form-input"
                  placeholder="Enter notification message..."
                />
              </div>

              <button className="btn btn-primary" onClick={handleSaveSettings}>
                <FiSave className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Category Management</h2>
              <p className="text-secondary-600 mt-1">Manage medical specialization categories</p>
            </div>
            <div className="card-body space-y-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-input flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button className="btn btn-primary" onClick={handleAddCategory}>
                  Add Category
                </button>
              </div>

              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-secondary-500">No categories found</p>
                  </div>
                ) : (
                  categories.map((category) => (
                    <div key={category._id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                      <span className="font-medium text-secondary-900">{category.name}</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
