const multer  = require('multer');
const path = require('path');
// SET STORAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '__' + file.originalname);
    }
});

//Limits 8 MiB/file
const upload = multer({ storage: storage, limits: { fileSize: 8388608 } });

module.exports = upload;