const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//các HTTP get
router.get('/', authMiddleware.logoutRequired, controller.getAuth);
router.get('/login', authMiddleware.logoutRequired, controller.getAuthLogin);
router.get('/logout', authMiddleware.loginRequired, controller.getAuthLogout);

//các HTTP post
// login mặc định sẽ là qua CMND/CCCD, còn muốn login dạng khác thì URL khác
router.post('/loginphonenumber', authMiddleware.logoutRequired, controller.postAuthLoginViaPhoneNumber);
router.post('/loginemail', authMiddleware.logoutRequired, controller.postAuthLoginViaEmail);
router.post('/loginCitizenIdentificationId', authMiddleware.logoutRequired, controller.postAuthLoginViaCitizenIdentificationId);
router.post('/login', authMiddleware.logoutRequired, controller.postAuthLoginAIO);

module.exports = router;
