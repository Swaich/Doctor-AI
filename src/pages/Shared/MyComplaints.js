import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';


const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints/my-complaints');
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      in_review: '#3b82f6',
      resolved: '#10b981'
    };
    return colors[status] || '#64748b';
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
      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">My Complaints</h1>
            <p className="text-secondary-600">Track and manage your filed complaints</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/complaints/new'}
          >
            File New Complaint
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
          {complaints.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-secondary-500 text-lg mb-4">No complaints filed yet</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/complaints/new'}
                >
                  File Your First Complaint
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pr-2">
              {complaints.map((complaint) => (
                <div key={complaint._id} className="card card-hover">
                  <div className="card-body">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{complaint.subject}</h3>
                        {complaint.againstId ? (
                          <p className="text-sm text-secondary-600 mb-1">
                            <span className="font-medium">Against:</span> {complaint.againstId.name || complaint.againstId.email}
                          </p>
                        ) : (
                          <p className="text-sm text-secondary-600 mb-1">General Complaint</p>
                        )}
                        <p className="text-xs text-secondary-500">
                          Filed on {new Date(complaint.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        complaint.status === 'pending' 
                          ? 'bg-warning-100 text-warning-700'
                          : complaint.status === 'in_review'
                            ? 'bg-primary-100 text-primary-700'
                            : complaint.status === 'resolved'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-secondary-100 text-secondary-700'
                      }`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-secondary-700 leading-relaxed">{complaint.description}</p>
                    </div>

                    {complaint.adminResponse && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <h4 className="font-semibold text-primary-800 mb-2">Admin Response:</h4>
                        <p className="text-primary-700">{complaint.adminResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyComplaints;
