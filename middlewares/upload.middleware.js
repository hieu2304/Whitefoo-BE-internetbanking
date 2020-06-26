const multer = require('multer');
// Set storage
const storage = multer.memoryStorage();

// Limit 8 MiB/file
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'image/png' && file.mimetype !== 'image/gif' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/bmp') {
            return cb(null, false, new Error('Invalid file format'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 8388608
    }
});

module.exports = upload;