import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');
const certificatesDir = path.join(uploadsDir, 'certificates');

[uploadsDir, imagesDir, videosDir, certificatesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const userImageDir = path.join(imagesDir, userId);
    
    if (!fs.existsSync(userImageDir)) {
      fs.mkdirSync(userImageDir, { recursive: true });
    }
    
    cb(null, userImageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || req.body.sessionId || 'anonymous';
    const userVideoDir = path.join(videosDir, userId);
    
    if (!fs.existsSync(userVideoDir)) {
      fs.mkdirSync(userVideoDir, { recursive: true });
    }
    
    cb(null, userVideoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for certificates
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const userCertificatesDir = path.join(certificatesDir, userId);

    if (!fs.existsSync(userCertificatesDir)) {
      fs.mkdirSync(userCertificatesDir, { recursive: true });
    }

    cb(null, userCertificatesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `certificate-${uniqueSuffix}${safeExt}`);
  },
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.'), false);
  }
};

// File filter for certificates (images + pdf)
const certificateFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
  }
};

// Multer instances
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
});

export const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: certificateFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_CERTIFICATE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: parseInt(process.env.MAX_CERTIFICATE_FILES) || 10,
  },
});

// Error handler for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        data: null,
        error: {
          code: 'UPLOAD_FILE_TOO_LARGE',
          message: 'File size exceeds the maximum allowed limit',
        },
        meta: {},
      });
    }
    
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
      meta: {},
    });
  }
  
  if (err) {
    return res.status(415).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message,
      },
      meta: {},
    });
  }
  
  next();
};
