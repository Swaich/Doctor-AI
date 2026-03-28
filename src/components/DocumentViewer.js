import React, { useState, useEffect } from 'react';
import { FiEye, FiDownload, FiFileText, FiImage, FiUser, FiX } from 'react-icons/fi';
import api from '../utils/api';
import './DocumentViewer.css';


const DocumentViewer = ({ doctorId, documents, doctorName }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const documentTypes = {
    profilePhoto: {
      label: 'Profile Photo',
      icon: <FiUser />,
      description: 'Doctor\'s profile picture'
    },
    degreeDocument: {
      label: 'Degree Certificate',
      icon: <FiFileText />,
      description: 'Medical degree certificate'
    },
    licenseDocument: {
      label: 'Medical License',
      icon: <FiFileText />,
      description: 'Medical council license'
    },
    idProof: {
      label: 'Government ID',
      icon: <FiFileText />,
      description: 'Government issued ID proof'
    }
  };

  const handleViewDocument = async (type) => {
    setSelectedDocument(type);
    setIsModalOpen(true);
    setLoading(true);
    
    try {
      console.log(`🔍 Loading document: ${type} for doctor: ${doctorId}`);
      
      // Fetch the document as blob with proper authentication
      const response = await api.get(`/admin/doctors/${doctorId}/document/${type}`, {
        responseType: 'blob'
      });
      
      console.log('📄 Document response:', {
        size: response.data.size,
        type: response.data.type,
        status: response.status
      });
      
      // Create object URL for the blob
      const url = URL.createObjectURL(response.data);
      console.log('🔗 Created blob URL:', url);
      setImageUrl(url);
    } catch (error) {
      console.error('❌ Error loading document:', error);
      setImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // Clean up object URL when modal closes
  useEffect(() => {
    if (!isModalOpen && imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  }, [isModalOpen, imageUrl]);

  const handleDownloadDocument = async (type) => {
    try {
      const response = await api.get(`/admin/doctors/${doctorId}/document/${type}`, {
        responseType: 'blob'
      });
      
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doctorName}_${type}_${documents[type]?.originalName || 'document'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setLoading(false);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="document-viewer">
      <h3>📄 Uploaded Documents</h3>
      
      <div className="documents-grid">
        {Object.entries(documentTypes).map(([type, config]) => {
          const doc = documents[type];
          const hasDocument = doc && doc.hasFile;
          
          return (
            <div key={type} className={`document-card ${hasDocument ? 'has-document' : 'no-document'}`}>
              <div className="document-header">
                <div className="document-icon">
                  {config.icon}
                </div>
                <div className="document-info">
                  <h4>{config.label}</h4>
                  <p>{config.description}</p>
                </div>
              </div>
              
              {hasDocument ? (
                <div className="document-details">
                  <div className="file-info">
                    <span className="file-name">{doc.originalName}</span>
                    <span className="file-size">{formatFileSize(doc.size)}</span>
                    <span className="file-type">{doc.contentType}</span>
                  </div>
                  
                  <div className="document-actions">
                    <button
                      className="btn-view"
                      onClick={() => handleViewDocument(type)}
                      title="View document"
                    >
                      <FiEye /> View
                    </button>
                    <button
                      className="btn-download"
                      onClick={() => handleDownloadDocument(type)}
                      title="Download document"
                    >
                      <FiDownload /> Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-document">
                  <span>No document uploaded</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Document Viewer Modal */}
      {isModalOpen && selectedDocument && (
        <div className="document-modal-overlay" onClick={closeModal}>
          <div className="document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{documentTypes[selectedDocument].label}</h3>
              <button className="close-btn" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-content">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading document...</p>
                </div>
              ) : imageUrl ? (
                documents[selectedDocument]?.contentType?.startsWith('image/') ? (
                  <img
                    src={imageUrl}
                    alt={documentTypes[selectedDocument].label}
                    className="document-image"
                    onError={(e) => {
                      console.error('Image failed to load');
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : (
                  <div className="pdf-viewer">
                    <iframe
                      src={imageUrl}
                      title={documentTypes[selectedDocument].label}
                      className="document-iframe"
                    />
                  </div>
                )
              ) : (
                <div className="document-error">
                  <FiFileText size={64} color="#666" />
                  <p>Unable to load document</p>
                  <small>The document may be corrupted or there was an error loading it</small>
                  <br />
                  <button 
                    className="btn-download" 
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    style={{ marginTop: '1rem' }}
                  >
                    <FiDownload /> Download to view
                  </button>
                </div>
              )}
              <div className="image-error" style={{ display: 'none', textAlign: 'center', padding: '2rem' }}>
                <FiFileText size={64} color="#666" />
                <p>Unable to load image</p>
                <small>The image may be corrupted or in an unsupported format</small>
                <br />
                <button 
                  className="btn-download" 
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  style={{ marginTop: '1rem' }}
                >
                  <FiDownload /> Download to view
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn-download-modal"
                onClick={() => handleDownloadDocument(selectedDocument)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;