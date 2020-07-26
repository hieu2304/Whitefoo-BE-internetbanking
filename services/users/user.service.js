const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const moment = require('moment');
const Model = Sequelize.Model;
const Op = Sequelize.Op;
const db = require('../db');
const randomHelper = require('../../helpers/random.helper');
const jwtHelper = require('../../helpers/jwt.helper');
const emailHelper = require('../../helpers/email.helper');
const makeMessageHelper = require('../../helpers/makeMessage.helper');
const accountService = require('../accounts/account.service');
const errorListConstant = require('../../constants/errorsList.constant');
const fee_paymentService = require('../accounts/fee_payment.service');
const Decimal = require('decimal.js');
const exchange_currencyService = require('../currency/exchange_currency.service');
const audit_logService = require('../users/audit_log.service');
const system_logService = require('../system/system_log.service');
const citizenService = require('./citizen.service');
const requestService = require('request');

class User extends Model {
	////////////////////////////////////////////////////////////////////////////////
	//						CÁC HÀM TÌM KIẾM, TÌM KIẾM RỒI KIỂM TRA
	////////////////////////////////////////////////////////////////////////////////

	//tìm user theo khóa chính id
	static async findUserByPKNoneExclude(id) {
		const user = await User.findByPk(id);
		if (!user) return null;

		const result = user.dataValues;
		result.dateOfBirth = user.dateOfBirth;
		result.emailVerified = 1;
		if (user.activeCode !== '') result.emailVerified = 0;

		return result;
	}
	static async findUserByPKUsingExclude(id) {
		const result = await User.findUserByPKNoneExclude(id);
		if (!result) return null;

		delete result.password;
		delete result.createdAt;
		delete result.updatedAt;
		delete result.verifyCode;
		delete result.forgotCode;
		delete result.activeCode;

		return result;
	}

	//tìm user tương đối theo: email, sdt, cmnd và username
	static async findUserNoneExclude(username) {
		const user = await User.findOne({
			where: {
				[Op.or]: [
					{ email: username },
					{ citizenIdentificationId: username },
					{ phoneNumber: username },
					{ username: username }
				]
			}
		});

		if (!user) return null;

		const result = user.dataValues;
		result.dateOfBirth = user.dateOfBirth;
		result.emailVerified = 1;
		if (user.activeCode !== '') result.emailVerified = 0;

		return result;
	}
	static async findUserUsingExclude(username) {
		const result = await User.findUserNoneExclude(username);
		if (!result) return null;

		delete result.password;
		delete result.createdAt;
		delete result.updatedAt;
		delete result.verifyCode;
		delete result.forgotCode;
		delete result.activeCode;

		return result;
	}

	//hàm nhân viên lấy danh sách các tài khoản chưa duyệt cmnd: đang chờ duyệt
	static async getPendingVerifyUserList() {
		const list = await User.findAll({
			where: {
				approveStatus: 2
			}
		});

		const result = [];
		for (var i = 0; i < list.length; i++) {
			const itemUser = await User.findUserByPKUsingExclude(list[i].id);
			itemUser.identificationType = '';
			itemUser.issueDate = '';
			const citizenInfo = await citizenService.findCitizenByCitizenId(itemUser.citizenIdentificationId);
			if (citizenInfo) {
				itemUser.identificationType = citizenInfo.identificationType;
				itemUser.issueDate = citizenInfo.issueDate;
			}

			result.push(itemUser);
		}

		return result;
	}

	//hàm nhân viên tìm kiếm trả về list user theo keyword
	static async searchByKeyword(request) {
		const keyword = request.keyword.toLowerCase();
		const listNumberOne = await User.findAll({
			where: {
				[Op.or]: [
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), { [Op.like]: '%' + keyword + '%' }),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('citizenIdentificationId')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('phoneNumber')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('username')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('firstName')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('lastName')), {
						[Op.like]: '%' + keyword + '%'
					}),

					//Họ + ' ' + Tên
					Sequelize.where(
						Sequelize.fn(
							'lower',
							Sequelize.fn('concat', Sequelize.col('lastName'), ' ', Sequelize.col('firstName'))
						),
						{
							[Op.like]: '%' + keyword + '%'
						}
					)
				],
				userType: 1
			},
			attributes: {
				exclude: [ 'password', 'createdAt', 'updatedAt', 'verifyCode', 'forgotCode', 'activeCode' ]
			}
		});

		const result = [];
		for (var i = 0; i < listNumberOne.length; i++) {
			result.push(listNumberOne[i].dataValues);
			result[i].dateOfBirth = listNumberOne[i].dateOfBirth;
			result[i].emailVerified = 1;
			const checkUser = await User.findUserByPKNoneExclude(result[i].id);
			if (checkUser.activeCode !== '') {
				result[i].emailVerified = 0;
			}
		}

		return result;
	}

	//hàm nhân viên lấy danh sách STK của 1 user
	static async getUserAccount(request) {
		const user = await User.findUserByPKNoneExclude(request.id);
		if (!user) return null;
		const accountList = await accountService.getAllAccountReferenceByIdNoneExclude(request.id);

		return accountList;
	}

	//user lấy danh sách STK của mình dựa vào id
	static async getAccount(request) {
		const accountList = await accountService.getAllAccountReferenceByIdUsingExclude(request.id.toString());
		return accountList;
	}

	//kiểm tra trùng username
	static async checkConflictUserName(username) {
		const conflictEmail = await User.findAll({
			where: {
				username: username
			}
		});
		if (conflictEmail.length > 0) return 'Conflict User Name';
		return null;
	}
	//kiểm tra trùng email
	static async checkConflictEmail(email) {
		const conflictEmail = await User.findAll({
			where: {
				email: email
			}
		});
		if (conflictEmail.length > 0) return 'Conflict email';
		return null;
	}
	//kiểm tra trùng SDT
	static async checkConflictPhoneNumber(phoneNumber) {
		const conflictPhoneNumber = await User.findAll({
			where: {
				phoneNumber: phoneNumber
			}
		});
		if (conflictPhoneNumber.length > 0) return 'Conflict phone number';
		return null;
	}
	//kiểm tra trùng CMND
	static async checkConflictCitizenIdentificationId(citizenIdentificationId) {
		const conflictCitizenIdentificationId = await User.findAll({
			where: {
				citizenIdentificationId: citizenIdentificationId
			}
		});
		if (conflictCitizenIdentificationId.length > 0) return 'Conflict citizenIdentificationId';
		return null;
	}
	//hàm này kiểm tra trùng tổng hợp 4 cái 1 lúc: CMND, SDT, USERNAME, EMAIL
	static async checkConflictUser(request) {
		//tạo 1 Error List sẵn
		const errorList = [];

		//ở đây ta sẽ dùng lỗi của phần đăng nhập được khai báo từ trước
		const checkConflictUserErrors = errorListConstant.userErrorsConstant;

		//Kiểm tra Email trùng
		if (typeof request.email !== 'undefined' && request.email != null) {
			var isConflictEmail = await User.checkConflictEmail(request.email);
			if (isConflictEmail) errorList.push(checkConflictUserErrors.EMAIL_CONFLICT);
		} else {
			errorList.push(checkConflictUserErrors.EMAIL_TOO_SHORT);
		}

		//Kiểm tra username trùng
		if (typeof request.username !== 'undefined' && request.username != null) {
			var isConflictUserName = await User.checkConflictUserName(request.username);
			if (isConflictUserName) errorList.push(checkConflictUserErrors.USERNAME_CONFLICT);
		} else {
			errorList.push(checkConflictUserErrors.USERNAME_TOO_SHORT);
		}

		//Kiểm tra phoneNumber trùng
		if (typeof request.phoneNumber !== 'undefined' && request.phoneNumber != null) {
			var isConflictPhoneNumber = await User.checkConflictPhoneNumber(request.phoneNumber);
			if (isConflictPhoneNumber) errorList.push(checkConflictUserErrors.PHONENUMBER_CONFLICT);
		} else {
			errorList.push(checkConflictUserErrors.PHONENUMBER_TOO_SHORT);
		}

		//nếu danh sách lỗi có ít nhất 1 thì trả ra cho bên create, bên create trả cho controller
		if (errorList.length > 0) return errorList;

		//nếu danh sách lỗi trống -> nghĩa là không trùng gì cả, return null cho hàm create biết
		return null;
	}

	//hàm đếm số lượng nhân viên hiện có
	static async countStaff() {
		const countList = await User.findAndCountAll({
			where: {
				userType: 0
			}
		});

		const count = countList.count;
		return count;
	}

	//user lấy thông tin của mình
	static async getInfoByUser(currentUser, detailsType) {
		const result = {};

		const foundUser = await User.findUserByPKUsingExclude(currentUser.id);

		foundUser.identificationType = '';
		foundUser.issueDate = '';

		const citizenInfo = await citizenService.findCitizenByCitizenId(foundUser.citizenIdentificationId);
		if (citizenInfo) {
			foundUser.identificationType = citizenInfo.identificationType;
			foundUser.issueDate = citizenInfo.issueDate;
		}

		if (detailsType === 'all' || detailsType === 'full') return foundUser;
		else if (detailsType === 'details' || detailsType === 'detail') {
			delete foundUser.approveStatus;
			delete foundUser.emailVerified;

			return foundUser;
		} else if (detailsType === 'status') {
			result.id = foundUser.id;
			result.citizenIdentificationId = foundUser.citizenIdentificationId;
			result.email = foundUser.email;
			result.approveStatus = foundUser.approveStatus;
			result.emailVerified = foundUser.emailVerified;

			return result;
		}

		//basic hoặc để trống
		result.id = foundUser.id;
		result.email = foundUser.email;
		result.lastName = foundUser.lastName;
		result.firstName = foundUser.firstName;
		result.userType = foundUser.userType;
		result.status = foundUser.status;

		return result;
	}

	//nhân viên lấy thông tin của 1 user nhất định
	static async getUserInfoByStaff(id) {
		const result = await User.findUserByPKUsingExclude(id);
		if (!result) return null;
		result.identificationType = '';
		result.issueDate = '';

		const citizenInfo = await citizenService.findCitizenByCitizenId(result.citizenIdentificationId);
		if (citizenInfo);
		{
			result.identificationType = citizenInfo.identificationType;
			result.issueDate = citizenInfo.issueDate;
		}

		return result;
	}

	//nhân viên lấy danh sách theo tiêu chí
	static async getUserListByStaff(request) {
		var limit = request.limit;
		var start = request.start;

		//nếu không truyền hoặc ko phải số thì gán giá trị mặc định
		if (typeof limit === 'undefined' || !await User.isNumber(limit)) {
			limit = 3;
		}
		if (typeof start === 'undefined' || !await User.isNumber(start)) {
			start = 0;
		}

		start = start * limit;

		const result = [];

		const detailsType = typeof request.type !== 'undefined' ? request.type : 'none';

		//các tiêu chí duyệt mặc định:
		//trình trạng duyệt cmnd sẽ là tất cả
		var approveStatusArr = [ 0, 1, 2 ];
		//tình trạng user mặc định là tất cả
		var statusArr = [ 0, 1 ];
		//tình trạng loại người dụng mặc định là tất cả
		var userTypeArr = [ 0, 1 ];

		if (detailsType === 'pending') {
			approveStatusArr = [ 2 ];
		} else if (detailsType === 'approved') {
			approveStatusArr = [ 1 ];
		} else if (detailsType === 'blocked' || detailsType === 'locked') {
			statusArr = [ 0 ];
		} else if (detailsType === 'manager' || detailsType === 'staff') {
			userTypeArr = [ 0 ];
		} else if (detailsType === 'user') {
			userTypeArr = [ 1 ];
		}

		const list = await User.findAll({
			where: {
				approveStatus: approveStatusArr,
				status: statusArr,
				userType: userTypeArr
			},
			offset: Number(start),
			limit: Number(limit),
			order: [ [ 'id', 'ASC' ] ]
		});

		for (var i = 0; i < list.length; i++) {
			result.push(await User.findUserByPKUsingExclude(list[i].id));
		}

		return result;
	}

	////////////////////////////////////////////////////////////////////////////////
	//						CÁC HÀM TÌM KIẾM RỒI XÁC THỰC, XÁC THỰC
	////////////////////////////////////////////////////////////////////////////////

	//xác thực mã 2 bước, có thì trả ra user
	static async activeVerifyCode(_code) {
		const isExist = await User.findOne({
			where: {
				verifyCode: _code
			}
		});
		if (isExist) {
			await User.update(
				{
					verifyCode: ''
				},
				{
					where: { verifyCode: _code }
				}
			);
			return isExist;
		}
		return null;
	}
	//xác thực mã kích hoạt EMAIL, có thì trả ra user
	static async activeEmailCode(_code) {
		const isExist = await User.findOne({
			where: {
				activeCode: _code
			}
		});
		if (isExist) {
			await User.update(
				{
					activeCode: ''
				},
				{
					where: { activeCode: _code }
				}
			);
			return isExist;
		}
		return null;
	}
	//xác thực mã quên mật khẩu, có thì trả ra user
	static async verifyForgotCode(_code) {
		const isExist = await User.findOne({
			where: {
				forgotCode: _code
			}
		});
		if (isExist) return isExist;
		return null;
	}

	//hàm kiểm tra user active email chưa
	static async checkUserActiveEmailCodeYet(currentUser) {
		const isExist = await User.findOne({
			where: {
				email: currentUser.email,
				activeCode: ''
			}
		});

		if (isExist) return isExist;
		return null;
	}
	//hàm kiểm tra user active CMND chưa
	static async checkUserApprovedYet(currentUser) {
		const isExist = await User.findOne({
			where: {
				email: currentUser.email,
				approveStatus: 1 //chỉ 1 là ok, 0 và 2 là chưa duyệt
			}
		});

		//nếu đã approve, return true (AKA not null)
		if (isExist) return isExist;
		return null;
	}

	static async checkInternalUser(currentUser) {
		const isExist = await User.findOne({
			where: {
				email: currentUser.email,
				userType: 0
			}
		});
		if (isExist) return isExist;
		return null;
	}

	//login step one
	static async authenticationLoginAIO({ username, password }) {
		const authUser = await User.findUserNoneExclude(username);
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;

		const result = await User.findUserByPKUsingExclude(authUser.id);

		//nếu có kích hoạt 2 lớp thì send mail và qua bước 2
		if (authUser.enable2fa === 1) {
			await User.sendVerify(authUser);
			delete result.id;
			delete result.citizenIdentificationId;
			delete result.email;
			delete result.phoneNumber;
			delete result.username;
			delete result.lastName;
			delete result.firstName;
			delete result.dateOfBirth;
			delete result.address;
			delete result.userType;
			delete result.approveStatus;
			delete result.emailVerified;
			delete result.status;

			return result;
		}

		const token = jwtHelper.generateToken(result);

		//sẽ trả thêm result
		result.token = token;
		return result;
	}

	//Login step two
	static async authenticationLoginAIOStepTwo(verifyCode) {
		//xác minh verifyCode
		const authUser = await User.activeVerifyCode(verifyCode);
		if (!authUser) return null;

		const result = await User.findUserByPKUsingExclude(authUser.id);
		const token = jwtHelper.generateToken(result);

		result.message = 'OK';
		result.token = token;
		return result;
	}

	//kiểm tra user gọi api resend email đã verify chưa, verify rồi thì không send
	static async resendEmailActiveCode(currentUser) {
		const resendEmailActiveCodeErrors = errorListConstant.userErrorsConstant;
		const ErrorsList = [];
		const foundUser = await User.findUserByPKNoneExclude(currentUser.id);
		if (foundUser.activeCode === '') {
			ErrorsList.push(resendEmailActiveCodeErrors.EMAIL_VERIFIED);
			return ErrorsList;
		}

		//kiểm tra qua 5p chưa
		const historySendActive = await system_logService.findOne({
			where: {
				userId: currentUser.id,
				action: 'send active'
			},
			order: [ [ 'time', 'DESC' ] ]
		});

		var historyItem = historySendActive.dataValues;
		//historyItem.hours = moment(historyItem.time).hours();
		//historyItem.minutes = moment(historyItem.time).minutes();
		historyItem.day = moment(historyItem.time).dates();
		historyItem.month = moment(historyItem.time).months() + 1;
		historyItem.year = moment(historyItem.time).years();

		const now = new moment();
		//historyItem.hoursNow = moment(now).hours();
		//historyItem.minutesNow = moment(now).minutes();
		//ko dùng days và day vì nó đếm ngày trong tuần (ví dụ friday sẽ trả ra 5)
		historyItem.dayNow = moment(now).dates();
		//dùng months sẽ phải +1 và theo moment: tháng đếm từ 0
		historyItem.monthNow = moment(now).months() + 1;
		historyItem.yearNow = moment(now).years();

		//cùng ngày + tháng + năm + giờ và chỉ cách nhau dưới 5p sẽ trả ra lỗi
		if (
			historyItem.yearNow === historyItem.year &&
			historyItem.monthNow === historyItem.month &&
			historyItem.dayNow === historyItem.day
		) {
			const millisecondsPassed = now.diff(historyItem.time);
			const minutesPassed = moment.duration(millisecondsPassed).asMinutes();
			if (minutesPassed < 5.0) {
				ErrorsList.push(resendEmailActiveCodeErrors.ACTIVE_SENT);
				return ErrorsList;
			}
		}

		await User.sendActive(currentUser);

		return null;
	}

	////////////////////////////////////////////////////////////////////////////////
	//								CÁC HÀM TẠO
	////////////////////////////////////////////////////////////////////////////////

	//đăng ký
	static async createNewUser(request) {
		const isUserConflict = await User.checkConflictUser(request);

		//trả về lỗi conflict hoặc thiếu gì đó nếu có lỗi, = null nghĩa là OK
		if (isUserConflict) return isUserConflict;

		const newUser = await User.create({
			email: request.email,
			lastName: request.lastName,
			firstName: request.firstName,
			//ép sang dạng của Postgre là MM/DD/YYYY, DB của postgre ko chứa DD/MM/YYYY
			//đừng lo vì DB đã có hàm format sẵn khi lấy ra
			dateOfBirth: moment(request.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD hh:mm:ss'),
			phoneNumber: request.phoneNumber,
			username: request.username,
			address: request.address,
			password: await User.hashPassword(request.password)
		});

		//send email here
		if (newUser) {
			await User.sendActive(newUser);
		}

		//return null to controller know action was success
		return null;
	}

	//send mã xác nhận email(activeCode)
	static async sendActive(currentUser) {
		//dựa vào accountId, tìm Email rồi gửi mã xác nhận
		const ErrorsList = [];
		const sendActiveErrors = errorListConstant.userErrorsConstant;
		const foundUser = await User.findUserByPKUsingExclude(currentUser.id);

		if (!foundUser) {
			ErrorsList.push(sendActiveErrors.USER_NOT_FOUND);
			return errorList;
		}

		const newActiveCode = await User.getUniqueRandomCode();

		//update DB
		await User.update(
			{
				activeCode: newActiveCode
			},
			{
				where: { id: currentUser.id }
			}
		);

		makeMessageHelper.verifyEmailMessage(
			foundUser.email,
			foundUser.lastName,
			foundUser.firstName,
			newActiveCode,
			function(response) {
				emailHelper.send(
					foundUser.email,
					'Kích hoạt tài khoản',
					response.content,
					response.html,
					response.attachments
				);
			}
		);

		await system_logService.pushSystemLog(foundUser.id, 'send active', 'send active');

		return null;
	}

	//cần tạo mã 2 bước gọi hàm này (verifyCode)
	static async sendVerify(currentUser) {
		//dựa vào accountId, tìm Email rồi gửi mã xác nhận
		const ErrorsList = [];
		const sendVerifyErrors = errorListConstant.userErrorsConstant;
		const foundUser = await User.findUserByPKUsingExclude(currentUser.id);

		if (!foundUser) {
			ErrorsList.push(sendVerifyErrors.USER_NOT_FOUND);
			return errorList;
		}

		//nếu vượt qua kiểm tra thì bắt đầu quá trình send mã
		const newVerifyCode = await User.getUniqueRandomVerifyCode();

		//update DB
		await User.update(
			{
				verifyCode: newVerifyCode
			},
			{
				where: { id: currentUser.id }
			}
		);

		//send Email
		makeMessageHelper.transferVerifyMessage(
			foundUser.email,
			foundUser.lastName,
			foundUser.firstName,
			newVerifyCode,
			function(response) {
				emailHelper.send(
					foundUser.email,
					'Xác minh 2 bước',
					response.content,
					response.html,
					response.attachments
				);
			}
		);

		await system_logService.pushSystemLog(foundUser.id, 'send verify', 'send verify');

		return null;
	}

	//quên mật khẩu bước 1: tạo forgotCode và gửi email cho user quên mât khẩu
	static async ForgotPasswordStepOne(request) {
		if (typeof request.email === 'undefined' || request.email === '' || request.email === ' ') return null;

		//tìm user
		//user phải kích hoạt email rồi mới quên mật khẩu lấy lại qua email được
		const forgotPasswordUser = await User.findOne({
			where: {
				email: request.email
			}
		});

		if (!forgotPasswordUser) {
			return null;
		}
		const newForgotCode = await User.getUniqueRandomCode();
		await User.update(
			{
				forgotCode: newForgotCode
			},
			{
				where: { email: request.email }
			}
		);
		//send email here
		if (forgotPasswordUser) {
			makeMessageHelper.forgotPasswordMessage(
				forgotPasswordUser.email,
				forgotPasswordUser.lastName,
				forgotPasswordUser.firstName,
				newForgotCode,
				function(response) {
					emailHelper.send(
						forgotPasswordUser.email,
						'Khôi phục mật khẩu',
						response.content,
						response.html,
						response.attachments
					);
				}
			);
		}

		await system_logService.pushSystemLog(forgotPasswordUser.id, 'send forgot', 'send forgot');

		//return result
		return newForgotCode;
	}

	////////////////////////////////////////////////////////////////////////////////
	//							CÁC HÀM CHỈNH SỬA, CẬP NHẬT
	////////////////////////////////////////////////////////////////////////////////

	//thằng nào xin làm nhân viên trước thằng đó được làm
	static async requestStaff(request) {
		if (typeof request.id === 'undefined') return 'id must not empty';
		const checkUser = await User.findByPk(request.id);
		if (!checkUser) return 'id not exists';

		const countList = await User.findAndCountAll({
			where: {
				userType: 0
			}
		});

		const count = countList.count;

		//nếu đã có ít nhất 1 nhân viên rồi thì chờ thằng đã làm nhân viên set lên
		if (count > 0) return 'fail';

		//nếu chưa có thì thằng này lên làm nhân viên
		const result = await User.update(
			{
				userType: 0,
				approveStatus: 1,
				activeCode: ''
			},
			{
				where: {
					id: request.id
				}
			}
		);

		return null;
	}

	//hàm này được viết cho chức năng đã đăng nhập muốn đổi mật khẩu và đổi thông tin tài khoản
	static async changePasswordAfterLogin(request, currentUser) {
		//request.currentPassword, newPassword
		const result = await User.findUserNoneExclude(currentUser.email);
		if (!result) return null;
		const verifyOldPassword = await User.verifyPassword(request.currentPassword, result.password);
		if (!verifyOldPassword) return null;

		await User.update(
			{
				password: await User.hashPassword(request.newPassword)
			},
			{
				where: {
					email: currentUser.email
				}
			}
		);
		return result;
	}

	//bước 3 của quên mật khẩu
	static async ForgotPasswordStepThree(request) {
		if (!request.forgotCode) return null;

		const isExist = await User.verifyForgotCode(request.forgotCode);

		if (!isExist) return null;

		await User.update(
			{
				password: await User.hashPassword(request.newPassword),
				forgotCode: '',
				activeCode: '' //nếu thành công sẽ kích hoạt email luôn nếu từ trước chưa kích hoạt email
			},
			{
				where: { email: isExist.email }
			}
		);

		return isExist;
	}

	//nhân viên duyệt cmnd user (update approveStatus)
	static async verifyIdCard(request, currentUser) {
		// 0 là từ chối, 1 là duyệt, 2 là chờ
		var newApprove = request.approveStatus;
		if (typeof newApprove === 'undefined' || !await User.isNumber(newApprove)) {
			newApprove = 0;
		}
		const userId = typeof request.userId !== 'undefined' ? request.userId : request.id;
		const foundUser = await User.findUserByPKNoneExclude(userId);
		if (!foundUser) return null;

		if (foundUser.approveStatus !== 1) {
			newApprove = parseInt(newApprove);

			//update
			await User.update(
				{
					approveStatus: newApprove
				},
				{
					where: {
						id: userId
					}
				}
			);
			//push audit log
			await audit_logService.pushAuditLog(currentUser.id, userId, 'approve', 'approveStatus: ' + newApprove);

			//chỉ send email khi duyệt = 1
			if (newApprove !== 1) return foundUser;
			makeMessageHelper.approvedCitizenIdMessage(
				foundUser.lastName,
				foundUser.firstName,
				foundUser.citizenIdentificationId,
				function(response) {
					emailHelper.send(
						foundUser.email,
						'Đã duyệt CMND/CCCD',
						response.content,
						response.html,
						response.attachments
					);
				}
			);
		}

		return foundUser;
	}

	//người dùng tự update thông tin cá nhân
	static async updateSelfInfo(request, currentUser) {
		const errorList = [];
		const updateSelfInfoErrors = errorListConstant.userErrorsConstant;

		const user = await User.findUserByPKNoneExclude(currentUser.id);
		if (!user) {
			errorList.push(updateSelfInfoErrors.USER_NOT_FOUND);
			return errorList;
		}

		//đâu tiên là các thông tin cơ bản, thay đổi ko cần 2 bước qua mail hay chờ phê duyệt
		var newLastName = request.lastName;
		if (!newLastName) newLastName = user.lastName;

		var newFirstName = request.firstName;
		if (!newFirstName) newFirstName = user.firstName;

		var newAddress = request.address;
		if (!newAddress) newAddress = user.address;

		var newEnable2fa = request.enable2fa;
		if (!newEnable2fa) newEnable2fa = user.enable2fa;
		else {
			newEnable2fa = parseInt(request.enable2fa);
			if (newEnable2fa !== 1 && newEnable2fa !== 0) newEnable2fa = user.enable2fa;
		}

		var newDateOfBirth = request.dateOfBirth;
		if (!newDateOfBirth) {
			newDateOfBirth = user.dateOfBirth;
			newDateOfBirth = moment(newDateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD hh:mm:ss');
		} else {
			//chỉ format khi và chỉ khi khác data cũ, hạn chế xài format tránh lỗi
			newDateOfBirth = moment(request.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD hh:mm:ss');
		}

		//tiếp đến là các thông tin quan trọng: username, email, phoneNumber...
		//cmnd sử dụng form khác, api riêng nên ko dùng ở đây

		var newPhoneNumber = request.phoneNumber;
		if (newPhoneNumber && newPhoneNumber != user.phoneNumber) {
			//Kiểm tra SDT trùng
			var isConflict = await User.checkConflictPhoneNumber(newPhoneNumber);
			if (isConflict) {
				errorList.push(updateSelfInfoErrors.PHONENUMBER_CONFLICT);
			}
		} else {
			newPhoneNumber = user.phoneNumber;
		}

		var newUsername = request.username;
		if (newUsername && newUsername != user.username) {
			//Kiểm tra username trùng với ai khác
			var isConflict = await User.checkConflictUserName(newUsername);
			if (isConflict) {
				errorList.push(updateSelfInfoErrors.USERNAME_CONFLICT);
			}
		} else {
			newUsername = user.username;
		}

		//tạo newActiveCode dùng cho Email
		var newActiveCode = '';
		var newEmail = request.email;
		//nếu ng dùng có nhập email và khác email cũ
		if (newEmail && newEmail != user.email) {
			//Kiểm tra trùng email
			var isConflict = await User.checkConflictEmail(newEmail);
			if (isConflict) {
				errorList.push(updateSelfInfoErrors.EMAIL_CONFLICT);
			} else {
				newActiveCode = await User.getUniqueRandomCode();
			}
			//Regular Expresion...type: Email
		} else {
			//nếu ng dùng ko nhập email và các TH còn lại
			newEmail = user.email;
		}

		if (newActiveCode !== '') {
			//send email tới email cũ
			makeMessageHelper.changeEmailMessageOldEmail(newLastName, newFirstName, user.email, newEmail, function(
				response
			) {
				emailHelper.send(user.email, 'Thay đổi Email', response.content, response.html, response.attachments);
			});

			//send email tới email mới
			makeMessageHelper.changeEmailMessageNewEmail(newEmail, newLastName, newFirstName, newActiveCode, function(
				response
			) {
				emailHelper.send(
					newEmail,
					'Kích hoạt Email mới',
					response.content,
					response.html,
					response.attachments
				);
			});
		}

		//phần mật khẩu: không update logic chung các thông tin khác, chỉ update khi thực sự đổi
		if (request.currentPassword && request.currentPassword !== '') {
			//nếu có nhập mk cũ đúng thì mới tiến hành xem xét mk mới
			const newPassword = request.newPassword;
			const confirmPassword = request.confirmPassword;
			if (await User.verifyPassword(request.currentPassword, user.password)) {
				if (newPassword !== confirmPassword) {
					errorList.push(updateSelfInfoErrors.PASSWORD_NOT_EQUAL);
				} else if (newPassword.length < 8) {
					errorList.push(updateSelfInfoErrors.PASSWORD_TOO_SHORT);
				} else {
					await User.update(
						{
							password: await User.hashPassword(newPassword)
						},
						{
							where: {
								id: user.id
							}
						}
					);
				}
			} else {
				errorList.push(updateSelfInfoErrors.WRONG_PASSWORD);
			}
		}

		if (errorList.length > 0) return errorList;

		await User.update(
			{
				email: newEmail,
				address: newAddress,
				lastName: newLastName,
				firstName: newFirstName,
				enable2fa: newEnable2fa,
				dateOfBirth: newDateOfBirth,
				username: newUsername,
				phoneNumber: newPhoneNumber,
				activeCode: newActiveCode
			},
			{
				where: {
					id: user.id
				}
			}
		);

		return null;
	}

	//nhân viên update người dùng
	static async updateUserInfo(request, currentUser) {
		const errorList = [];

		const updateUserInfoErrors = errorListConstant.userErrorsConstant;

		const userId = typeof request.userId !== 'undefined' ? request.userId : request.id;
		if (!userId) {
			errorList.push(updateUserInfoErrors.USER_NOT_FOUND);
			return errorList;
		}

		const user = await User.findUserByPKUsingExclude(userId);
		if (!user) {
			errorList.push(updateUserInfoErrors.USER_NOT_FOUND);
			return errorList;
		}

		var newLastName = request.lastName;
		if (!newLastName) newLastName = user.lastName;

		var newFirstName = request.firstName;
		if (!newFirstName) newFirstName = user.firstName;

		var newAddress = request.address;
		if (!newAddress) newAddress = user.address;

		// chỉ nhận 2 trạng thái 0 = login normal 1 = login 2fa
		var newEnable2fa = request.enable2fa;
		if (!newEnable2fa) newEnable2fa = user.enable2fa;
		else {
			newEnable2fa = parseInt(request.enable2fa);
			if (newEnable2fa !== 1 && newEnable2fa !== 0) newEnable2fa = user.enable2fa;
		}

		//1 = OK, 0 = Locked, chỉ nhận 2 dạng tình trạng tài khoản
		var newStatus = request.status;
		if (!newStatus) newStatus = user.status;
		else {
			newStatus = parseInt(request.status);
			if (newStatus !== 1 && newStatus !== 0) newStatus = user.status;
		}

		//userType: 1 là khách hàng và 0 là nhân viên, chỉ nhận 2 dạng này
		var newUserType = request.userType;
		if (!newUserType) newUserType = user.userType;
		else {
			newUserType = parseInt(request.userType);
			if (newUserType !== 1 && newUserType !== 0) newStatus = user.status;
		}

		//approveStatus: 1 là đã duyệt cmnd, 0 là từ chối, 2 là đang chờ duyệt
		var newApprove = request.approveStatus;
		if (!newApprove) newApprove = user.approveStatus;
		else {
			newApprove = parseInt(request.approveStatus);
			if (newApprove !== 1 && newApprove !== 0 && newApprove !== 2) newApprove = user.approveStatus;
		}

		//chỉnh định dạng date theo yêu cầu của postgre là YYYY-MM-DD
		var newDateOfBirth = request.dateOfBirth;
		if (!newDateOfBirth) {
			newDateOfBirth = user.dateOfBirth;
			newDateOfBirth = moment(newDateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD hh:mm:ss');
		} else {
			//chỉ format khi và chỉ khi khác data cũ, hạn chế xài format tránh lỗi
			newDateOfBirth = moment(request.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD hh:mm:ss');
		}

		var newEmail = request.email;
		//nếu ng dùng có nhập email và khác email cũ
		if (newEmail && newEmail != user.email) {
			//Kiểm tra trùng với ng khác
			var isConflict = await User.checkConflictEmail(newEmail);
			if (isConflict) {
				errorList.push(updateUserInfoErrors.EMAIL_CONFLICT);
			}
			//Regular Expresion...type: Email
		} else {
			//nếu ng dùng ko nhập email và các TH còn lại
			newEmail = user.email;
		}

		var newUsername = request.username;
		if (newUsername && newUsername != user.username) {
			//Kiểm tra trùng với ai khác
			var isConflict = await User.checkConflictUserName(newUsername);
			if (isConflict) {
				errorList.push(updateUserInfoErrors.USERNAME_CONFLICT);
			}
		} else {
			newUsername = user.username;
		}

		var newPhoneNumber = request.phoneNumber;
		if (newPhoneNumber && newPhoneNumber != user.phoneNumber) {
			//Kiểm tra SDT trùng
			var isConflict = await User.checkConflictPhoneNumber(newPhoneNumber);
			if (isConflict) {
				errorList.push(updateUserInfoErrors.PHONENUMBER_CONFLICT);
			}
		} else {
			newPhoneNumber = user.phoneNumber;
		}

		var newCitizenIdentificationId = request.citizenIdentificationId;
		if (newCitizenIdentificationId && newCitizenIdentificationId != user.citizenIdentificationId) {
			//Kiểm tra CMND trùng
			var isConflict = await User.checkConflictCitizenIdentificationId(newCitizenIdentificationId);
			if (isConflict) {
				errorList.push(updateUserInfoErrors.CITIZENIDENTIFICATIONID_CONFLICT);
			}
		} else {
			newCitizenIdentificationId = user.newCitizenIdentificationId;
		}

		if (errorList.length > 0) return errorList;

		//update thông tin user
		const resultupdate = await User.update(
			{
				lastName: newLastName,
				firstName: newFirstName,
				address: newAddress,
				status: newStatus, // chỉ nhận 0 và 1
				dateOfBirth: newDateOfBirth,
				userType: newUserType, // chỉ nhận 0 và 1
				email: newEmail,
				phoneNumber: newPhoneNumber,
				username: newUsername,
				citizenIdentificationId: newCitizenIdentificationId,
				approveStatus: newApprove,
				enable2fa: newEnable2fa // chỉ nhận 0 và 1
			},
			{
				where: { id: userId }
			}
		);

		//push xuống log
		const result = await User.findUserByPKNoneExclude(userId);
		if (resultupdate) {
			await audit_logService.pushAuditLog(
				currentUser.id,
				userId,
				'update info',
				'update ' +
					userId +
					': ' +
					newLastName +
					',' +
					newFirstName +
					',' +
					newAddress +
					',' +
					newDateOfBirth +
					',' +
					newStatus +
					',' +
					newCitizenIdentificationId +
					',' +
					newPhoneNumber +
					',' +
					newUsername +
					',' +
					newEmail
			);
		}

		//send email ở đây
		return null;
	}

	//nhân viên nạp tiền cho người dùng
	static async loadUpBalance(request, currentUser) {
		const result = await accountService.addBalanceForAccount(request, currentUser);
		if (!result) return null;

		const loadForAccount = await accountService.getAccountNoneExclude(request.accountId);
		const loadForUser = await User.findUserByPKNoneExclude(parseInt(loadForAccount.userId));

		//gửi email
		makeMessageHelper.loadUpSuccessMessage(
			loadForUser.email,
			request.accountId,
			loadForUser.lastName,
			loadForUser.firstName,
			request.balance,
			request.currency,
			loadForAccount.currencyType,
			result.newBalance,
			function(response) {
				emailHelper.send(
					loadForUser.email,
					'Nạp tiền thành công',
					response.content,
					response.html,
					response.attachments
				);
			}
		);

		return result;
	}

	//chuyển tiền nội bộ
	static async transferInternalStepTwo(request, currentUser) {
		var message = request.message;
		if (!message || message == ' ' || message == '') message = 'Không có tin nhắn kèm theo!';
		const ErrorsList = [];
		const errorListTransfer = errorListConstant.accountErrorsConstant;
		const userTransferErrors = errorListConstant.userErrorsConstant;
		const requestAccountId = request.requestAccountId; //currentUser's accountId
		const accountId = request.accountId; //Destination accountId
		var money = new Decimal(request.money); //tiền để tính toán ở bên gửi
		var transferMoney = new Decimal(request.money); //tiền để tính toán ở bên nhận
		const foundAccount = await accountService.getAccountNoneExclude(requestAccountId);

		//không cho phép tài khoản gửi và nhận là 1
		if (requestAccountId === accountId) {
			ErrorsList.push(errorListTransfer.SELF_DETECT);
			return ErrorsList;
		}

		//nếu không tìm thấy hoặc tài khoản bên gửi không thuộc loại thanh toán
		if (!foundAccount || foundAccount.accountType !== 0) {
			ErrorsList.push(errorListTransfer.SELF_NOT_EXISTS);
			return ErrorsList;
		}

		//nếu tài khoản bên gửi đang bị khóa (1 là OK, 0 closed, 2là locked)
		if (foundAccount.status !== 1) {
			ErrorsList.push(errorListTransfer.SELF_LOCKED);
			return ErrorsList;
		}

		//nếu giá trị muốn gửi quá thấp thì không cho gửi, tối thiểu 20k VND
		//kiểm tra giới hạn trong ngày, tháng, đợt giao dịch
		//bên gửi xài đơn vị khác VND thì chuyển về VND TẠM THỜI để kiểm tra(TH1 và TH2)
		if (foundAccount.currencyType !== 'VND') {
			//đổi toàn bộ tiền gửi dạng USD(money) sang tiền VND(tempMoney)
			var tempMoney = await exchange_currencyService.exchangeMoney(money, foundAccount.currencyType);

			//nếu mệnh giá < 20k
			if (parseFloat(tempMoney) < 20000) {
				ErrorsList.push(errorListTransfer.REQUIRE_MINIMUM);
				return ErrorsList;
			}
			//kiểm tra giới hạn đơn vị giao dịch...
			//...Code here
			//kiểm tra giới hạn của ngày
			//...Code here
			//kiểm tra giới hạn của tháng
			//...Code here
		} else {
			//nếu bên gửi xài đơn vị VND thì khỏi đổi về TẠM THỜI
			if (parseFloat(money) < 20000) {
				ErrorsList.push(errorListTransfer.REQUIRE_MINIMUM);
				return ErrorsList;
			}
			//kiểm tra giới hạn đơn vị giao dịch...
			//...Code here
			//kiểm tra giới hạn của ngày
			//...Code here
			//kiểm tra giới hạn của tháng
			//...Code here
		}

		//xác thực verifyCode...
		const checkingUser = await User.activeVerifyCode(request.verifyCode);

		if (!checkingUser) {
			ErrorsList.push(userTransferErrors.VERIFYCODE_INVALID);
			return ErrorsList;
		}

		//Nếu thằng đang đăng nhập không sở hữu tài khoản bên gửi thì xóa mã verify rồi cút nó ra
		if (checkingUser.id !== currentUser.id || parseInt(foundAccount.userId) !== currentUser.id) {
			ErrorsList.push(errorListTransfer.NOT_BELONG);
			return ErrorsList;
		}

		//kiếm tra tiền muốn gửi + phí bên gửi có đủ không
		//tính phí với giá tiền muốn gửi hiện tại, 1 là nội bộ, 0 là liên ngân hàng
		//LƯU Ý: FEE NÀY CHỈ TÍNH CHO MỆNH GIÁ LÀ VNĐ, tính phí phải chuyển sang VND hết rồi chuyển lại sau (TH1 và TH2)
		var newFee = new Decimal(0.0);
		if (foundAccount.currencyType !== 'VND') {
			//đổi toàn bộ tiền gửi USD(money) sang tiền VND(tempMoney) để tính chi phí, vì bảng phí ta để theo VND
			var tempMoney = await exchange_currencyService.exchangeMoney(money, foundAccount.currencyType);
			//tính chi phí theo VND
			newFee = await fee_paymentService.getTransferFee(tempMoney, 1);
		} else {
			newFee = await fee_paymentService.getTransferFee(money, 1);
		}

		//vì phí tính theo VND, để tính toán +- vào tài khoản xài USD thì phải chuyển về USD (TH1 và TH2)
		if (foundAccount.currencyType !== 'VND') {
			newFee = await exchange_currencyService.exchangeMoney(newFee, 'VND');
		}

		//tổng tiền tiêu hao bên gửi (sẽ trừ cái này nếu chuyển thành công)
		//nếu tài khoản bên gửi VND: thì tổng = value(VND)+fee(VND)
		//nếu tài khoản bên gửi USD: thì tổng = value(USD)+fee(USD)
		var totalConsumeMoney = new Decimal(newFee).plus(money);
		if (parseFloat(totalConsumeMoney) > parseFloat(foundAccount.balance)) {
			ErrorsList.push(errorListTransfer.NOT_ENOUGH);
			return ErrorsList;
		}

		//sau khi hoàn tất kiểm tra bên gửi, ta kiểm tra tài khoản bên nhận (Destination account)
		//kiểm tra có tồn tại tài khoản bên nhận không
		const foundAccountDes = await accountService.getAccountNoneExclude(accountId);

		//nếu không tìm thấy hoặc tài khoản bên nhận không thuộc loại thanh toán
		if (!foundAccountDes || foundAccountDes.accountType !== 0) {
			ErrorsList.push(errorListTransfer.NOT_EXISTS);
			return ErrorsList;
		}

		//nếu tài khoản bên nhận đang bị khóa (1 là OK, 0 closed, 2 là locked)
		if (foundAccountDes.status !== 1) {
			ErrorsList.push(errorListTransfer.LOCKED);
			return ErrorsList;
		}

		//sau khi hoàn thành các đợt kiểm tra, tiến hành chuyển khoản Internal

		//B1: kiểm tra đơn vị tiền tệ 2 bên, đổi cho bên nhận nếu cần thiết
		//(TH1 và TH3)
		if (foundAccount.currencyType !== foundAccountDes.currencyType) {
			//Total = value + fee, chỉ chuyển value sang đơn vị của bên nhận
			transferMoney = await exchange_currencyService.exchangeMoney(money, foundAccount.currencyType);
		}

		//B2: tiến hành trừ bên gửi(trừ tiền gửi + Phí) và cộng tiền cho bên Nhận(chỉ cộng tiền gửi)
		//bên gửi
		var newBalance = new Decimal(foundAccount.balance).sub(totalConsumeMoney);
		//bên nhận
		var newBalanceDes = new Decimal(foundAccountDes.balance).plus(transferMoney);

		//update bên gửi
		await accountService.update(
			{
				balance: newBalance
			},
			{
				where: {
					accountId: foundAccount.accountId
				}
			}
		);
		//update bên nhận
		await accountService.update(
			{
				balance: newBalanceDes
			},
			{
				where: {
					accountId: foundAccountDes.accountId
				}
			}
		);

		//B3: lấy giá trị mới rồi send email thông báo cho cả 2 bên
		//bên A trước
		const foundUser = await User.findUserByPKNoneExclude(parseInt(foundAccount.userId));

		makeMessageHelper.transferSuccessMessage(
			foundUser.email,
			foundUser.lastName,
			foundUser.firstName,
			money,
			newFee,
			foundAccount.accountId,
			foundAccountDes.accountId,
			newBalance,
			foundAccount.currencyType,
			message,
			function(response) {
				emailHelper.send(
					foundUser.email,
					'Chuyển tiền thành công',
					response.content,
					response.html,
					response.attachments
				);
			}
		);

		//bên B sau
		const foundUserDes = await User.findUserByPKNoneExclude(parseInt(foundAccountDes.userId));

		makeMessageHelper.transferSuccessMessageDes(
			foundUserDes.email,
			foundUserDes.lastName,
			foundUserDes.firstName,
			transferMoney,
			foundAccount.accountId,
			foundAccountDes.accountId,
			newBalanceDes,
			foundAccountDes.currencyType,
			message,
			function(response) {
				emailHelper.send(
					foundUserDes.email,
					'Nhận tiền thành công',
					response.content,
					response.html,
					response.attachments
				);
			}
		);

		return null;
	}

	//rút tiền
	static async withdrawStepTwo(request, currentUser) {
		const ErrorsList = [];
		const withdrawStepTwoErrors = errorListConstant.accountErrorsConstant;

		//xác thực verifyCode...
		const checkingUser = await User.activeVerifyCode(request.verifyCode);

		if (!checkingUser) {
			ErrorsList.push(withdrawStepTwoErrors.VERIFYCODE_INVALID);
			return ErrorsList;
		}

		//Nếu thằng đang đăng nhập không sở hữu tài khoản thì xóa mã verify rồi cút nó ra
		if (checkingUser.id !== currentUser.id || parseInt(foundAccount.userId) !== currentUser.id) {
			ErrorsList.push(withdrawStepTwoErrors.NOT_BELONG);
			return ErrorsList;
		}

		// makeMessageHelper.withdrawMessageAccumulated(
		// 	'timchideyeu1998@gmail.com',
		// 	'Nguyễn',
		// 	'Ngọc',
		// 	6500000,
		// 	50000,
		// 	'0123456789',
		// 	360,
		// 	1,
		// 	12,
		// 	'14/7/2020',
		// 	0,
		// 	'USD',
		// 	'không em, thích thì rút',
		// 	function(response) {
		// 		emailHelper.send(
		// 			'timchideyeu1998@gmail.com',
		// 			'Rút tiền thành công',
		// 			response.content,
		// 			response.html,
		// 			response.attachments
		// 		);
		// 	}
		// );
		return null;
	}

	////////////////////////////////////////////////////////////////////////////////
	//							CÁC HÀM HỖ TRỢ KHÁC
	////////////////////////////////////////////////////////////////////////////////
	//các hàm check hỗ trợ để tạo mã
	static async checkIfExistVerifyCode(_code) {
		const isExist = await User.findOne({
			where: {
				verifyCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}
	static async checkIfExistActiveCode(_code) {
		const isExist = await User.findOne({
			where: {
				activeCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}
	static async checkIfExistForgotCode(_code) {
		const isExist = await User.findOne({
			where: {
				forgotCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}
	//hàm này đảm bảo code random được tạo ra là độc nhất, đang không tồn tại trong DB
	static async getUniqueRandomCode() {
		var randomCode = randomHelper.getRandomString(15);
		while ((await User.checkIfExistForgotCode(randomCode)) || (await User.checkIfExistActiveCode(randomCode))) {
			randomCode = randomHelper.getRandomString(15);
		}
		return randomCode;
	}

	//hàm lấy mã verify random unique
	static async getUniqueRandomVerifyCode() {
		var randomCode = randomHelper.getRandomNumber(6);
		while (await User.checkIfExistVerifyCode(randomCode)) {
			randomCode = randomHelper.getRandomNumber(15);
		}
		return randomCode;
	}

	//các hàm liên quan password
	static hashPassword(passwordInput) {
		return bcrypt.hashSync(passwordInput, 10);
	}
	static verifyPassword(passwordsUnHashed, passwordsHashed) {
		return bcrypt.compareSync(passwordsUnHashed, passwordsHashed);
	}

	//kiểm tra có phải số
	static isNumber(n) {
		return !isNaN(parseFloat(n)) && !isNaN(n - 0);
	}
}

User.init(
	{
		citizenIdentificationId: {
			type: Sequelize.STRING,
			allowNull: true,
			unique: true,
			defaultValue: null
		},
		email: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		phoneNumber: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		username: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		lastName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		firstName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		dateOfBirth: {
			type: Sequelize.DATEONLY,
			//định dạng khi lấy dữ liệu ra, sẽ tự format thành Ngày/tháng/năm
			//vì postgre mặc định sẽ trả ra dạng YYYY-MM-DD
			//postgre khi input date chỉ nhận 2 dạng: YYYY-MM-DD hh:mm:ss và MM-DD-YYYY hh:mm:ss (dấu - hoặc /)
			//nếu muốn data lấy ra đã được getter định dạng thì ko dùng .dataValues
			get: function() {
				return moment.utc(this.getDataValue('dateOfBirth')).format('DD/MM/YYYY');
			}
		},
		address: {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: 'Việt Nam'
		},
		userType: {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 1 // 1 = member, 0 = internal user
		},
		status: {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 1 // 1 = OK, 0 = Locked
		},

		//approveStatus: 1 là đã duyệt cmnd, 0 là từ chối, 2 là đang chờ duyệt
		approveStatus: {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0
		},

		enable2fa: {
			type: Sequelize.INTEGER, //1 là có kích hoạt 2 bước login, 0 là ko có
			allowNull: false,
			defaultValue: 0
		},

		password: {
			type: Sequelize.STRING,
			allowNull: false
		},
		//mã xác nhận 2 bước
		verifyCode: {
			type: Sequelize.STRING,
			allowNull: true,
			defaultValue: ''
		},
		//mã quên mật khẩu
		forgotCode: {
			type: Sequelize.STRING,
			allowNull: true,
			defaultValue: ''
		},
		//mã kích hoạt tài khoản khi đăng ký
		activeCode: {
			type: Sequelize.STRING,
			allowNull: true,
			defaultValue: ''
		}
	},
	{
		sequelize: db,
		modelName: 'user'
	}
);

module.exports = User;
