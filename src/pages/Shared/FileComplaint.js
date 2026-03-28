import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const FileComplaint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { againstId, consultationId } = location.state || {};

  const [formData, setFormData] = useState({
    againstId: againstId || '',
    subject: '',
    description: ''
  });
  const [files, setFiles] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    
    // Only add againstId if it's not empty and looks like a valid MongoDB ObjectId
    if (formData.againstId && formData.againstId.trim().length === 24) {
      data.append('againstId', formData.againstId.trim());
    }
    
    if (consultationId) {
      data.append('consultationId', consultationId);
    }
    
    data.append('subject', formData.subject);
    data.append('description', formData.description);
    
    files.forEach(file => {
      data.append('evidence', file);
    });

    try {
      await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Complaint submitted successfully!');
      navigate('/complaints');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
      console.error('Complaint error:', error.response?.data);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">File a Complaint</h1>
          <p className="text-secondary-600">We take your concerns seriously and will address them promptly</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!againstId && (
                <div className="form-group">
                  <label className="form-label">Complaint Against (User ID) - Optional</label>
                  <input
                    type="text"
                    value={formData.againstId}
                    onChange={(e) => setFormData({ ...formData, againstId: e.target.value })}
                    placeholder="Enter user ID (optional - leave blank for general complaint)"
                    className="form-input"
                  />
                  <p className="text-sm text-secondary-500 mt-1">
                    Leave blank for general complaints or platform issues
                  </p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Brief description of the issue"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  rows="6"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Provide detailed information about your complaint..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Evidence (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  accept="image/*,.pdf"
                  className="form-input"
                />
                <p className="text-sm text-secondary-500 mt-1">
                  Upload images or documents as evidence (max 5 files)
                </p>
                {files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-secondary-700">Selected files:</p>
                    <ul className="text-sm text-secondary-600">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span>📎</span>
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1 sm:flex-none">
                  Submit Complaint
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-secondary flex-1 sm:flex-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FileComplaint;
