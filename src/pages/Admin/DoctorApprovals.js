import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import DocumentViewer from '../../components/DocumentViewer';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const DoctorApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      const response = await api.get('/admin/doctors/pending');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      await api.put(`/admin/doctors/${doctorId}/status`, { status: 'approved' });
      toast.success('Doctor approved successfully!');
      fetchPendingDoctors();
    } catch (error) {
      toast.error('Failed to approve doctor');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await api.put(`/admin/doctors/${selectedDoctor}/status`, {
        status: 'rejected',
        rejectionReason
      });
      toast.success('Doctor rejected');
      setSelectedDoctor(null);
      setRejectionReason('');
      fetchPendingDoctors();
    } catch (error) {
      toast.error('Failed to reject doctor');
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
        {/* Enhanced Header with Badge */}
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-primary-50 to-purple-50 p-4 sm:p-6 rounded-xl border border-primary-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-primary-500 rounded-xl shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Doctor Approvals</h1>
                <p className="text-sm sm:text-base text-secondary-600">Review and approve doctor registrations</p>
              </div>
            </div>
            {doctors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-warning-500 text-white rounded-lg font-semibold text-sm sm:text-base shadow-md">
                  {doctors.length} Pending
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
          {doctors.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-white rounded-2xl p-8 sm:p-12 shadow-soft border border-secondary-100">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-2">All Caught Up!</h3>
                <p className="text-secondary-500 text-base sm:text-lg">No pending doctor approvals at the moment</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 pr-2">
              {doctors.map((doctor, index) => (
                <div key={doctor._id} className="card border-l-4 border-l-primary-500 hover:shadow-lg transition-all duration-300">
                  {/* Enhanced Header with Status Badge */}
                  <div className="card-header p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                          {doctor.userId?.name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-secondary-900">Dr. {doctor.userId?.name}</h3>
                          <p className="text-sm sm:text-base text-primary-600 font-semibold">{doctor.specialization?.name}</p>
                          <p className="text-xs sm:text-sm text-secondary-500 mt-1">Application #{index + 1}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 bg-warning-100 text-warning-800 rounded-full text-xs sm:text-sm font-semibold border border-warning-300 whitespace-nowrap">
                        Pending Review
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white">
                    {/* Personal Information Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                      <h4 className="text-sm sm:text-base font-bold text-secondary-900 mb-3">
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white rounded-lg p-3 sm:p-4">
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-blue-700">
                            Email
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900 break-all">{doctor.userId?.email}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-blue-700">
                            Phone
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900">{doctor.phone}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-blue-700">
                            Gender
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900 capitalize">{doctor.gender}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-blue-700">
                            Date of Birth
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900">{new Date(doctor.dateOfBirth).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Professional Credentials Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border-l-4 border-purple-500">
                      <h4 className="text-sm sm:text-base font-bold text-secondary-900 mb-3">
                        Professional Credentials
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white rounded-lg p-3 sm:p-4">
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-purple-700">
                            Qualification
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900 font-medium">{doctor.qualification}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-purple-700">
                            Experience
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900 font-medium">{doctor.experience} years</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-purple-700">
                            Registration Number
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900 font-mono">{doctor.medicalRegistrationNumber}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-purple-700">
                            Issuing Council
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900">{doctor.issuingMedicalCouncil}</p>
                        </div>
                      </div>
                    </div>

                    {/* Current Practice Section */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-l-4 border-green-500">
                      <h4 className="text-sm sm:text-base font-bold text-secondary-900 mb-3 flex items-center gap-2">
                        Current Practice
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white rounded-lg p-3 sm:p-4">
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-green-700 flex items-center gap-1">
                            Hospital/Clinic
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900">{doctor.currentHospitalClinic}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-green-700 flex items-center gap-1">
                             Working City
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900">{doctor.currentWorkingCity}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-green-700 flex items-center gap-1">
                             Languages
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {doctor.languagesSpoken?.map((lang, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* <div className="space-y-1 sm:space-y-2">
                          <span className="text-xs sm:text-sm font-semibold text-green-700 flex items-center gap-1">
                             Registration Type
                          </span>
                          <p className="text-sm sm:text-base text-secondary-900 capitalize">{doctor.registrationType}</p>
                        </div> */}
                      </div>
                    </div>

                    {/* Document Viewer Section */}
                    {doctor.fileInfo && (
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-500">
                        <h4 className="text-sm sm:text-base font-bold text-secondary-900 mb-3 flex items-center gap-2">
                          Uploaded Documents
                        </h4>
                        <div className="bg-white rounded-lg p-3 sm:p-4">
                          <DocumentViewer 
                            doctorId={doctor._id} 
                            documents={doctor.fileInfo} 
                            doctorName={doctor.userId?.name} 
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Section */}
                    <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg p-4 border-t-4 border-secondary-300">
                      <h4 className="text-sm sm:text-base font-bold text-secondary-900 mb-3 flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        Review Actions
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                          onClick={() => handleApprove(doctor._id)}
                          className="flex-1 sm:flex-none bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Approve Doctor</span>
                        </button>
                        <button
                          onClick={() => setSelectedDoctor(doctor._id)}
                          className="flex-1 sm:flex-none bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Reject Application</span>
                        </button>
                      </div>
                    </div>

                    {/* Rejection Form */}
                    {selectedDoctor === doctor._id && (
                      <div className="bg-gradient-to-r from-danger-50 to-red-100 border-2 border-danger-300 rounded-lg p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-md">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-danger-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-danger-800">Provide Rejection Reason</h4>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <textarea
                            placeholder="Enter detailed rejection reason (e.g., incomplete documents, invalid credentials, etc.)..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="4"
                            className="form-input text-sm w-full"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button 
                            onClick={handleReject} 
                            className="flex-1 bg-danger-600 hover:bg-danger-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Submit Rejection
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoctor(null);
                              setRejectionReason('');
                            }}
                            className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            Cancel
                          </button>
                        </div>
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

export default DoctorApprovals;
