const multer = require('multer');
const path = require('path');

// Store files in memory for processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG) and PDFs are allowed'));
  }
};

// Multer configuration for memory storage
exports.uploadToMemory = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter
});

// Helper function to convert file buffer to base64
exports.fileToBase64 = (file) => {
  if (!file || !file.buffer) return null;
  
  return {
    data: file.buffer.toString('base64'),
    contentType: file.mimetype,
    originalName: file.originalname,
    size: file.size
  };
};

// Helper function to validate file size and type
exports.validateFile = (file, maxSize = 5 * 1024 * 1024) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return errors;
  }
  
  if (file.size > maxSize) {
    errors.push(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Invalid file type. Only JPEG, PNG, and PDF files are allowed');
  }
  
  return errors;
};

// Helper function to get file info for response
exports.getFileInfo = (fileData) => {
  if (!fileData) return null;
  
  return {
    originalName: fileData.originalName,
    contentType: fileData.contentType,
    size: fileData.size,
    hasFile: !!fileData.data
  };
};