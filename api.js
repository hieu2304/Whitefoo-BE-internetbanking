const express = require('express');
const router = express.Router();
const jwt = require('./helpers/jwt.helper');
const authMiddleware = require('./middlewares/auth.middleware');

// Middleware that uses body-parser won't work on multer
router.use('/upload', require('./routes/upload.route'));

//middleware secret key, này sẽ luôn dùng, 1 addition Authentication ngoài JWT
router.use(authMiddleware.authSecret);

//các API routes không cần JWT, ko cần kích hoạt email, ko cần internal
router.use('/auth', require('./routes/auth.route'));
router.use('/register', require('./routes/register.route'));
router.use('/user', require('./routes/user.route'));

//các API cần JWT còn hiệu lực
router.use(jwt.authToken);

//các API cần tài khoản đã kích hoạt email
router.use(authMiddleware.verifyEmailRequired);

//các API cần các tài khoản đã xác nhận CMND/CCCD
router.use(authMiddleware.verifyCitizenIdentificationIdRequired);
router.use('/post', require('./routes/post.route'));
router.use('/token', require('./routes/token.route'));
router.use('/functional', require('./routes/functional.route'));

//các API gọi từ nhân viên ngân hàng
router.use(authMiddleware.internalUserRequired);
router.use('/internal', require('./routes/internal.route'));

module.exports = router;
