import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const response = await api.get(`/admin/complaints${params}`);
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (complaintId, status, response) => {
    try {
      await api.put(`/admin/complaints/${complaintId}`, {
        status,
        adminResponse: response
      });
      toast.success('Complaint updated successfully!');
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to update complaint');
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
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Complaints Management</h1>
          <p className="text-secondary-600">Monitor and resolve user complaints</p>
        </div>

        <div className="card mb-6">
          <div className="card-body">
            <div className="flex gap-3">
              <button
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`btn ${filter === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('doctor')}
              >
                Doctor Complaints
              </button>
              <button
                className={`btn ${filter === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('patient')}
              >
                Patient Complaints
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
          {complaints.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-secondary-500 text-lg">No complaints found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pr-2">
              {complaints.map((complaint) => (
                <div key={complaint._id} className="card card-hover">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{complaint.subject}</h3>
                        <p className="text-sm text-secondary-600">
                          <span className="font-medium">From:</span> {complaint.complainantId?.name || 'Unknown'} | 
                          <span className="font-medium ml-2">Against:</span> {complaint.againstId?.name || 'General/Platform'}
                        </p>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
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

                    {complaint.status === 'pending' && (
                      <div className="flex gap-3 pt-4 border-t border-secondary-200">
                        <button
                          onClick={() => handleUpdateStatus(complaint._id, 'in_review', 'Under review')}
                          className="btn btn-primary btn-sm"
                        >
                          Mark as In Review
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(complaint._id, 'resolved', 'Resolved')}
                          className="btn btn-success btn-sm"
                        >
                          Resolve
                        </button>
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

export default Complaints;
