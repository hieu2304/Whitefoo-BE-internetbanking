const multer = require('multer');
// Set storage
const storage = multer.memoryStorage();

// Limit 8 MiB/file
const image = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'image/png' && file.mimetype !== 'image/gif' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/bmp') {
            return cb(null, false, new Error('File format not supported'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 8388608
    }
});

// Limit 50 MiB/file
const audio = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'audio/mpeg' && file.mimetype !== 'audio/wav' && file.mimetype !== 'audio/x-wav' && file.mimetype !== 'audio/wave' && file.mimetype !== 'audio/aac' && file.mimetype !== 'audio/opus' && file.mimetype !== 'audio/ogg' && file.mimetype !== 'audio/flac' && file.mimetype !== 'audio/x-flac') {
            return cb(null, false, new Error('Audio format not supported'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 52428800
    }
});

module.exports = {
    image,
    audio
};