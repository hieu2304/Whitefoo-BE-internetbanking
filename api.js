const express = require('express');
const router = express.Router();
const jwt = require('./helpers/jwt.helper');
const authMiddleware = require('./middlewares/auth.middleware');
const scheduleHelper = require('./helpers/schedule.helper');

//################## SCHEDULE HERE ##################

//scheduleHelper.WhiteFooScheduleAll();

//################## CÁC API KHÔNG AUTHENTICATION ##################

//================== PUBLIC API ============================

// Pre-middleware won't work on multer
router.use('/upload', require('./routes/upload.route'));

//================ NON-PUBLIC API ==========================
//middleware secret key, này sẽ luôn dùng, 1 addition Authentication ngoài JWT
router.use(authMiddleware.authSecret);

//API captcha
router.use('/recaptcha', require('./routes/recaptcha.route'));

//các API routes không cần JWT, ko cần kích hoạt email, ko cần internal
//các API liên quan Authentication: login, logout, verify email
router.use('/auth', require('./routes/auth.route'));

//các API sử dụng khi chưa login vào: quên mật khẩu, đăng ký
router.use('/', require('./routes/guest.route'));

//các API liên quan JWT : gia hạn token (ko yêu cầu gì cả)
router.use('/', require('./routes/token.route'));

//################## CÁC API CÓ AUTHENTICATION ##################
//các API cần JWT còn hiệu lực, yêu cầu đã đăng nhập, tài khoản đã kích hoạt email, tài khoản đã xác nhận CMND/CCCD
//các auth con trong authAll theo thứ tự: authToken, loginRequired, verifyEmailRequired, verifyCitizenIdentificationIdRequired
router.use(authMiddleware.authAll);

//các api người dùng sử dụng sau khi login, verify hết các kiểu
//API test
router.use('/post', require('./routes/post.route'));

//các API tính năng người dùng sau khi login thành công: đổi mật khẩu, chuyển khoản...
router.use('/', require('./routes/functional.route'));

//các API gọi từ nhân viên ngân hàng
router.use(authMiddleware.internalUserRequired);
router.use('/', require('./routes/internal.route'));

module.exports = router;
