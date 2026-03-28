import React, { useState, useEffect } from 'react';
import { FiEye, FiUpload, FiCheck, FiX, FiFileText, FiUser, FiSend, FiTrash2, FiDownload } from 'react-icons/fi';
import api from '../utils/api';

const MyDocuments = ({ doctorId, doctorData, onDocumentUpdate }) => {
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState({});
  const [draftDocuments, setDraftDocuments] = useState({});
  const [submittingForReview, setSubmittingForReview] = useState(false);
  const [discardingDrafts, setDiscardingDrafts] = useState(false);

  const documentTypes = {
    profilePhoto: {
      label: 'Profile Photo',
      icon: <FiUser className="w-5 h-5" />,
      description: 'Your profile picture (visible to patients)'
    },
    degreeDocument: {
      label: 'Degree Certificate',
      icon: <FiFileText className="w-5 h-5" />,
      description: 'Medical degree certificate'
    },
    licenseDocument: {
      label: 'Medical License',
      icon: <FiFileText className="w-5 h-5" />,
      description: 'Medical council license'
    },
    idProof: {
      label: 'Government ID',
      icon: <FiFileText className="w-5 h-5" />,
      description: 'Government issued ID proof'
    }
  };

  useEffect(() => {
    if (doctorData) {
      processDocumentsFromProfile();
    } else {
      fetchDocuments();
    }
  }, [doctorId, doctorData]);

  const processDocumentsFromProfile = () => {
    try {
      setLoading(true);
      const processedDocs = {};
      const drafts = {};
      
      Object.keys(documentTypes).forEach(type => {
        const docData = doctorData[type];
        const draftData = doctorData.draftDocuments?.[type];
        
        if (docData && docData.data && docData.contentType) {
          processedDocs[type] = {
            hasFile: true,
            originalName: docData.originalName || `${type}.${docData.contentType?.split('/')[1] || 'file'}`,
            size: docData.size || 0,
            contentType: docData.contentType
          };
        } else {
          processedDocs[type] = {
            hasFile: false
          };
        }

        if (draftData && draftData.data && draftData.contentType) {
          drafts[type] = {
            hasFile: true,
            originalName: draftData.originalName || `${type}.${draftData.contentType?.split('/')[1] || 'file'}`,
            size: draftData.size || 0,
            contentType: draftData.contentType
          };
        }
      });
      
      setDocuments(processedDocs);
      setDraftDocuments(drafts);
    } catch (error) {
      console.error('Error processing documents from profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/me/profile`);
      const doctorProfile = response.data;
      
      const processedDocs = {};
      Object.keys(documentTypes).forEach(type => {
        const docData = doctorProfile[type];
        if (docData && docData.data && docData.contentType) {
          processedDocs[type] = {
            hasFile: true,
            originalName: docData.originalName || `${type}.${docData.contentType?.split('/')[1] || 'file'}`,
            size: docData.size || 0,
            contentType: docData.contentType
          };
        } else {
          processedDocs[type] = {
            hasFile: false
          };
        }
      });
      
      setDocuments(processedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (type) => {
    setSelectedDocument(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDocumentUpload = async (type, file, submitForReview = false) => {
    if (!file) return;

    if (type === 'profilePhoto') {
      setUploading(prev => ({ ...prev, [type]: true }));

      try {
        const formData = new FormData();
        formData.append('profilePhoto', file);

        await api.put('/doctors/me/profile-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setDocuments(prev => ({
          ...prev,
          [type]: {
            hasFile: true,
            originalName: file.name,
            size: file.size,
            contentType: file.type
          }
        }));

        if (onDocumentUpdate) {
          onDocumentUpdate();
        }

        alert(`${documentTypes[type].label} uploaded successfully!`);
      } catch (error) {
        console.error(`Error uploading ${type}:`, error);
        const errorMessage = error.response?.data?.message || `Failed to upload ${documentTypes[type].label}. Please try again.`;
        alert(errorMessage);
      } finally {
        setUploading(prev => ({ ...prev, [type]: false }));
      }
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const formData = new FormData();
      formData.append('document', file);
      if (submitForReview) {
        formData.append('submitForReview', 'true');
      }

      const response = await api.put(`/doctors/me/document/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (submitForReview) {
        setDocuments(prev => ({
          ...prev,
          [type]: {
            hasFile: true,
            originalName: file.name,
            size: file.size,
            contentType: file.type
          }
        }));
        setDraftDocuments(prev => {
          const newDrafts = { ...prev };
          delete newDrafts[type];
          return newDrafts;
        });
      } else {
        setDraftDocuments(prev => ({
          ...prev,
          [type]: {
            hasFile: true,
            originalName: file.name,
            size: file.size,
            contentType: file.type
          }
        }));
      }

      if (onDocumentUpdate) {
        onDocumentUpdate();
      }

      alert(response.data.message);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      const errorMessage = error.response?.data?.message || `Failed to upload ${documentTypes[type].label}. Please try again.`;
      alert(errorMessage);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmitForReview = async () => {
    if (Object.keys(draftDocuments).length === 0) {
      alert('No draft documents to submit for review.');
      return;
    }

    setSubmittingForReview(true);

    try {
      const response = await api.post('/doctors/me/submit-for-review');

      Object.keys(draftDocuments).forEach(type => {
        setDocuments(prev => ({
          ...prev,
          [type]: draftDocuments[type]
        }));
      });
      setDraftDocuments({});

      if (onDocumentUpdate) {
        onDocumentUpdate();
      }

      alert(response.data.message);
    } catch (error) {
      console.error('Error submitting for review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit documents for review. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmittingForReview(false);
    }
  };

  const handleDiscardDrafts = async () => {
    if (Object.keys(draftDocuments).length === 0) {
      alert('No draft documents to discard.');
      return;
    }

    if (!window.confirm('Are you sure you want to discard all draft changes? This action cannot be undone.')) {
      return;
    }

    setDiscardingDrafts(true);

    try {
      await api.delete('/doctors/me/draft-documents');
      setDraftDocuments({});
      alert('Draft changes discarded successfully.');
    } catch (error) {
      console.error('Error discarding drafts:', error);
      const errorMessage = error.response?.data?.message || 'Failed to discard draft changes. Please try again.';
      alert(errorMessage);
    } finally {
      setDiscardingDrafts(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiFileText className="w-5 h-5 mr-2" />
          My Uploaded Documents
        </h3>
        <p className="text-gray-600 mb-4">View and manage your uploaded documents</p>
        
        {/* Draft Mode Controls */}
        {Object.keys(draftDocuments).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="mb-3">
              <h4 className="font-semibold text-orange-800 flex items-center mb-2">
                <FiFileText className="w-4 h-4 mr-1" />
                Draft Changes Ready
              </h4>
              <p className="text-orange-700 text-sm mb-2">
                You have {Object.keys(draftDocuments).length} document(s) with unsaved changes.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(draftDocuments).map(type => (
                  <span key={type} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                    {documentTypes[type].label}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleSubmitForReview}
                disabled={submittingForReview}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submittingForReview ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    <span>Submit for Admin Review</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleDiscardDrafts}
                disabled={discardingDrafts}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {discardingDrafts ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Discarding...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span>Discard Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>    
        {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {Object.entries(documentTypes).map(([type, config]) => {
          const doc = documents[type];
          const draftDoc = draftDocuments[type];
          const hasDocument = doc && doc.hasFile;
          const hasDraft = draftDoc && draftDoc.hasFile;
          const isVerificationDoc = type !== 'profilePhoto';
          
          return (
            <div 
              key={type} 
              className={`border rounded-lg p-4 transition-all ${
                hasDocument 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              } ${hasDraft ? 'ring-2 ring-orange-200' : ''}`}
            >
              {/* Document Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${hasDocument ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{config.label}</h4>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {hasDocument ? (
                    <FiCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <FiX className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              
              {hasDocument || hasDraft ? (
                <div className="space-y-3">
                  {/* Draft Indicator */}
                  {hasDraft && (
                    <div className="bg-orange-100 border border-orange-200 rounded-lg p-2">
                      <span className="inline-flex items-center text-sm font-medium text-orange-800">
                        <FiFileText className="w-4 h-4 mr-1" />
                        Draft Changes
                      </span>
                      <p className="text-xs text-orange-700 mt-1">New version ready for review</p>
                    </div>
                  )}
                  
                  {/* Image Thumbnail */}
                  {(hasDocument && doc.contentType?.startsWith('image/')) && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={`data:${doctorData[type]?.contentType};base64,${doctorData[type]?.data}`}
                        alt={config.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 truncate">
                        {hasDraft ? draftDoc.originalName : (hasDocument ? doc.originalName : 'No file')}
                      </p>
                      <p className="text-gray-500">
                        {formatFileSize(hasDraft ? draftDoc.size : (hasDocument ? doc.size : 0))}
                      </p>
                      <p className="text-xs text-gray-400">
                        {hasDraft ? draftDoc.contentType : (hasDocument ? doc.contentType : '')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Document Actions */}
                  <div className="flex flex-wrap gap-2">
                    {hasDocument && (
                      <button
                        onClick={() => handleViewDocument(type)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        title="View current document"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>View Current</span>
                      </button>
                    )}
                    
                    <label className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium cursor-pointer">
                      {uploading[type] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-4 h-4" />
                          <span>{hasDraft ? 'Replace Draft' : 'Update'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept={type === 'profilePhoto' ? 'image/*' : '*/*'}
                        onChange={(e) => handleDocumentUpload(type, e.target.files[0])}
                        className="hidden"
                        disabled={uploading[type]}
                      />
                    </label>
                    
                    {isVerificationDoc && (
                      <button
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = '*/*';
                          fileInput.onchange = (e) => {
                            if (e.target.files[0]) {
                              handleDocumentUpload(type, e.target.files[0], true);
                            }
                          };
                          fileInput.click();
                        }}
                        disabled={uploading[type]}
                        className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                        title="Upload and submit for review immediately"
                      >
                        <FiSend className="w-4 h-4" />
                        <span>Upload & Submit</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">Not uploaded</p>
                  <p className="text-sm text-gray-500 mb-4">This document was not uploaded during registration</p>
                  
                  <div className="space-y-2">
                    <label className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                      {uploading[type] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-4 h-4" />
                          <span>Upload as Draft</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept={type === 'profilePhoto' ? 'image/*' : '*/*'}
                        onChange={(e) => handleDocumentUpload(type, e.target.files[0])}
                        className="hidden"
                        disabled={uploading[type]}
                      />
                    </label>
                    
                    {isVerificationDoc && (
                      <button
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = '*/*';
                          fileInput.onchange = (e) => {
                            if (e.target.files[0]) {
                              handleDocumentUpload(type, e.target.files[0], true);
                            }
                          };
                          fileInput.click();
                        }}
                        disabled={uploading[type]}
                        className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        title="Upload and submit for review immediately"
                      >
                        <FiSend className="w-4 h-4 inline mr-2" />
                        Upload & Submit
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
          <FiFileText className="w-4 h-4 mr-2" />
          Document Update System:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <p className="font-medium mb-1">Profile Photo:</p>
            <p>Updates immediately and is visible to patients</p>
          </div>
          <div>
            <p className="font-medium mb-1">Verification Documents:</p>
            <p>Saved as drafts first, then submitted for admin review</p>
          </div>
          <div>
            <p className="font-medium mb-1">Draft Mode:</p>
            <p>Update multiple documents, then submit all at once for review</p>
          </div>
          <div>
            <p className="font-medium mb-1">Immediate Submit:</p>
            <p>Use "Upload & Submit" to bypass draft mode</p>
          </div>
          <div>
            <p className="font-medium mb-1">Review Process:</p>
            <p>Your profile goes to "Pending" status during admin review</p>
          </div>
          <div>
            <p className="font-medium mb-1">Continue Practicing:</p>
            <p>You can still see patients while documents are under review</p>
          </div>
          <div>
            <p className="font-medium mb-1">Accepted Formats:</p>
            <p>PDF, JPG, PNG (Max size: 5MB per file)</p>
          </div>
          <div>
            <p className="font-medium mb-1">Security:</p>
            <p>All documents are encrypted and stored securely</p>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {isModalOpen && selectedDocument && documents[selectedDocument]?.hasFile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeModal();
            }
          }}
          tabIndex={0}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl max-h-full w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {documentTypes[selectedDocument].label}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close (Esc)"
                autoFocus
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 max-h-96 overflow-auto">
              {documents[selectedDocument]?.contentType?.startsWith('image/') ? (
                <img
                  src={`data:${doctorData[selectedDocument]?.contentType};base64,${doctorData[selectedDocument]?.data}`}
                  alt={documentTypes[selectedDocument].label}
                  className="w-full h-auto max-h-80 object-contain mx-auto"
                  onError={(e) => {
                    console.error('Image failed to load');
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Document preview not available</p>
                  <p className="text-sm text-gray-500 mb-4">This document type cannot be previewed in browser</p>
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:${doctorData[selectedDocument]?.contentType};base64,${doctorData[selectedDocument]?.data}`;
                      link.download = doctorData[selectedDocument]?.originalName || `${selectedDocument}.file`;
                      link.click();
                    }}
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Download Document</span>
                  </button>
                </div>
              )}
              <div className="text-center py-12 hidden">
                <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">Unable to load document</p>
                <p className="text-sm text-gray-500">The document may be corrupted or in an unsupported format</p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <button 
                onClick={closeModal}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;