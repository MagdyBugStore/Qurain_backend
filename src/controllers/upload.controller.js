import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload image
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'UPLOAD_NO_FILE',
          message: 'No image file provided',
        },
        meta: {},
      });
    }

    // Generate public URL
    const fileUrl = `/uploads/images/${req.user.id}/${req.file.filename}`;

    // TODO: Save file metadata to database

    res.status(201).json({
      success: true,
      data: {
        file: {
          id: 'file-id',
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          url: fileUrl,
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload video
 */
export const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'UPLOAD_NO_FILE',
          message: 'No video file provided',
        },
        meta: {},
      });
    }

    // Generate public URL
    const fileUrl = `/uploads/videos/${req.user.id}/${req.file.filename}`;

    // TODO: Save file metadata to database
    // TODO: Process video asynchronously (transcoding, thumbnail generation)

    res.status(201).json({
      success: true,
      data: {
        file: {
          id: 'file-id',
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          url: fileUrl,
          processing: true,
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream video with range support
 */
export const streamVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    // TODO: Fetch video file path from database
    const videoPath = path.join(__dirname, '../../uploads/videos', videoId, 'video.mp4');

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        meta: {},
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};
