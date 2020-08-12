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
const Decimal = require('decimal.js');
const exchange_currencyService = require('../currency/exchange_currency.service');
const audit_logService = require('../users/audit_log.service');
const system_logService = require('../system/system_log.service');
const citizenService = require('./citizen.service');
const account_logService = require('../accounts/account_log.service');
const whitelistService = require('../partner/whitelist.service');
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

		if (result.citizenIdentificationId == 'null' || !result.citizenIdentificationId) {
			result.citizenIdentificationId = '';
		}

		result.createdAt = moment(user.createdAt).format('DD/MM/YYYY HH:mm:ss');
		return result;
	}
	static async findUserByPKUsingExclude(id) {
		const result = await User.findUserByPKNoneExclude(id);
		if (!result) return null;

		delete result.password;
		//delete result.createdAt;
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

		if (result.citizenIdentificationId == 'null' || !result.citizenIdentificationId) {
			result.citizenIdentificationId = '';
		}

		result.createdAt = moment(user.createdAt).format('DD/MM/YYYY HH:mm:ss');

		return result;
	}
	static async findUserUsingExclude(username) {
		const result = await User.findUserNoneExclude(username);
		if (!result) return null;

		delete result.password;
		//delete result.createdAt;
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
			if (citizenInfo && typeof citizenInfo !== 'undefined') {
				itemUser.identificationType = citizenInfo.identificationType;
				itemUser.issueDate = citizenInfo.issueDate;
			}

			result.push(itemUser);
		}

		return result;
	}

	//hàm nhân viên lấy danh sách STK của 1 user
	static async getUserAccount(request) {
		var userId = typeof request.id !== 'undefined' ? request.id : request.userId;
		if (userId && (await User.isNumber(userId))) {
			userId = parseInt(userId);
		}
		const user = await User.findUserByPKNoneExclude(userId);
		if (!user) return null;
		const accountList = await accountService.getAccountList(userId, request);

		return accountList;
	}

	//user lấy danh sách STK của mình dựa vào id
	static async getAccount(currentUser, request) {
		const accountList = await accountService.getAccountList(currentUser.id, request);
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
		if (citizenInfo && typeof citizenInfo !== 'undefined') {
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

		if (citizenInfo && typeof citizenInfo !== 'undefined') {
			result.identificationType = citizenInfo.identificationType;
			result.issueDate = citizenInfo.issueDate;
		}

		return result;
	}

	//nhân viên lấy danh sách theo keyword, lọc theo tiêu chí, có phân trang
	//API này gộp từ 2 API cũ và trả ra count: searchkeyword và getuserlist
	static async searchUserByStaff(request) {
		var limit = request.limit;
		var start = request.start;
		var keyword = request.keyword;

		//nếu không truyền thì gán giá trị mặc định
		if (!keyword || keyword === ' ') keyword = '';
		keyword = keyword.toLowerCase();

		if (!limit || !await User.isNumber(limit)) {
			limit = 3;
		}
		if (!start || !await User.isNumber(start)) {
			start = 0;
		}

		//ví dụ start = 3, limit là 3
		//thì bắt đầu từ 9 (là phần tử thứ 10 và kết thúc phần tử thứ 12 - trang 4)
		start = start * limit;

		//type truyền vào, dùng để đặt tiêu chí tìm kiếm
		const detailsType = typeof request.type !== 'undefined' ? request.type : 'none';

		//các tiêu chí duyệt mặc định:
		//trình trạng duyệt cmnd sẽ là tất cả
		var approveStatusArr = [ 0, 1, 2 ];
		//tình trạng user mặc định là tất cả
		var statusArr = [ 0, 1 ];
		//tình trạng loại người dụng (quyền) mặc định là tất cả
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

		const totalList = await User.findAndCountAll({
			where: {
				//tiêu chí tìm kiếm từ api getuserlist
				approveStatus: approveStatusArr,
				status: statusArr,
				userType: userTypeArr,

				//keyword để tìm kiếm tương đối từ api searchkeyword
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

					//Tên + ' ' + Họ
					Sequelize.where(
						Sequelize.fn(
							'lower',
							Sequelize.fn('concat', Sequelize.col('lastName'), ' ', Sequelize.col('firstName'))
						),
						{
							[Op.like]: '%' + keyword + '%'
						}
					),

					//Họ + ' ' + Tên
					Sequelize.where(
						Sequelize.fn(
							'lower',
							Sequelize.fn('concat', Sequelize.col('firstName'), ' ', Sequelize.col('lastName'))
						),
						{
							[Op.like]: '%' + keyword + '%'
						}
					)
				]
			},

			offset: Number(start),
			limit: Number(limit),
			order: [ [ 'id', 'ASC' ] ]
		});

		const usersArr = totalList.rows;
		const count = totalList.count; //count trả ra ko bị ảnh hưởng bởi limit và start
		const list = [];

		for (var i = 0; i < usersArr.length; i++) {
			var temp = {};
			temp.id = usersArr[i].id;
			temp.email = usersArr[i].email;
			temp.lastName = usersArr[i].lastName;
			temp.firstName = usersArr[i].firstName;
			temp.address = usersArr[i].address;
			temp.status = usersArr[i].status;
			temp.approveStatus = usersArr[i].approveStatus;
			temp.emailVerified = 0;
			if (usersArr[i].activeCode === '') temp.emailVerified = 1;

			list.push(temp);
		}

		return { count, list };
	}

	//lấy audit log
	static async getAuditLogByStaff(request) {
		const anotherReq = { type: 'manager', keyword: request.by, limit: 999999 };
		const listStaff = await User.searchUserByStaff(anotherReq);
		const arrStaffId = [];
		for (var i = 0; i < listStaff.list.length; i++) {
			arrStaffId.push(listStaff.list[i].id.toString());
		}

		const result = await audit_logService.getAuditLog(request, arrStaffId);
		for (var i = 0; i < result.list.length; i++) {
			var tempStaff = await User.findUserByPKNoneExclude(result.list[i].id_user);
			var tempUser = await User.findUserByPKNoneExclude(result.list[i].id_target);
			result.list[i].fullName_user = tempStaff.firstName + ' ' + tempStaff.lastName;
			result.list[i].fullName_target = tempUser.firstName + ' ' + tempUser.lastName;
		}
		return result;
	}

	//get history activies account log
	static async getLogByUser(currentUser, request) {
		const accountArr = await accountService.getAccountIdArrayByUserId(currentUser.id);
		const listTotal = await account_logService.getAccountLogByAccountIdArr(
			accountArr,
			request.type,
			request.fromDate,
			request.toDate,
			request.start,
			request.limit
		);
		const list = [];

		for (var i = 0; i < listTotal.rows.length; i++) {
			list.push(JSON.parse(listTotal.rows[i].description));
			list[i].id = listTotal.rows[i].id;
		}

		return { count: listTotal.count, list };
	}

	//get history activies account log by staff
	static async getUserLogByStaff(request) {
		const accountArr = [];
		if (!request.accountId) return { count: 0, list: [] };

		accountArr.push(request.accountId);
		const listTotal = await account_logService.getAccountLogByAccountIdArr(
			accountArr,
			request.type,
			request.fromDate,
			request.toDate,
			request.start,
			request.limit
		);

		const list = [];

		for (var i = 0; i < listTotal.rows.length; i++) {
			list.push(JSON.parse(listTotal.rows[i].description));
			list[i].id = listTotal.rows[i].id;
		}

		return { count: listTotal.count, list };
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
		const LoginErrors = errorListConstant.userErrorsConstant;

		if (!username) return LoginErrors.LOGIN_INVALID;
		const authUser = await User.findUserNoneExclude(username);

		if (!authUser || !password) return LoginErrors.LOGIN_INVALID;
		if (!await User.verifyPassword(password, authUser.password)) return LoginErrors.LOGIN_INVALID;

		const result = await User.findUserByPKUsingExclude(authUser.id);

		if (authUser.status === 0) return LoginErrors.USER_BLOCKED;

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

			return { enable2fa: result.enable2fa };
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
		if (!historySendActive) {
			await User.sendActive(currentUser);
			return null;
		}

		var historyItem = historySendActive.dataValues;
		//historyItem.hours = moment(historyItem.time).hours();
		//historyItem.minutes = moment(historyItem.time).minutes();
		historyItem.day = moment(historyItem.time).date();
		historyItem.month = moment(historyItem.time).month() + 1;
		historyItem.year = moment(historyItem.time).year();

		const now = new moment();
		//historyItem.hoursNow = moment(now).hours();
		//historyItem.minutesNow = moment(now).minutes();
		//ko dùng days và day vì nó đếm ngày trong tuần (ví dụ friday sẽ trả ra 5)
		historyItem.dayNow = moment(now).date();
		//dùng months sẽ phải +1 và theo moment: tháng đếm từ 0
		historyItem.monthNow = moment(now).month() + 1;
		historyItem.yearNow = moment(now).year();

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
		var isUserConflict = await User.checkConflictUser(request);

		//trả về lỗi conflict hoặc thiếu gì đó nếu có lỗi, = null nghĩa là OK
		setTimeout(function() {
			if (isUserConflict) return isUserConflict;
		}, 2000);
		if (isUserConflict) return isUserConflict;

		const newUser = await User.create({
			email: request.email,
			lastName: request.lastName,
			firstName: request.firstName,
			//ép sang dạng của Postgre là MM/DD/YYYY, DB của postgre ko chứa DD/MM/YYYY
			//đừng lo vì DB đã có hàm format sẵn khi lấy ra
			dateOfBirth: moment(request.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss'),
			phoneNumber: request.phoneNumber,
			username: request.username,
			address: request.address,
			password: await User.hashPassword(request.password)
		}).catch(function(err) {
			//return err;
			if (isUserConflict) return isUserConflict;
		});

		if (typeof newUser.id === 'undefined') return newUser;

		//send email here
		if (newUser) {
			await User.sendActive(newUser);
		}

		//return null to controller know action was success
		return null;
	}

	// nhân viên tạo tài khoản cho người dùng
	static async createAccountForUser(request, currentUser) {
		const ErrorsList = [];
		const createAccountForUserErrors = errorListConstant.userErrorsConstant;
		const userId = typeof request.id !== 'undefined' ? request.id : request.userId;
		const foundUser = await User.findUserByPKNoneExclude(userId);
		if (!foundUser) {
			ErrorsList.push(createAccountForUserErrors.USER_NOT_FOUND);
			return { result: null, ErrorsList };
		}
		//chỉ tạo cho user kích hoạt CMND rồi
		// if (foundUser.approveStatus !== 1) {
		// 	ErrorsList.push(createAccountForUserErrors.USER_NOT_VERIFY);
		// 	return { result: null, ErrorsList };
		// }

		const result = await accountService.createNewAccount(request);
		if (result.ErrorsList) return result;

		await audit_logService.pushAuditLog_CreateAccount(currentUser, foundUser, result.accountId);

		return result;
	}

	//send mã xác nhận email(activeCode)
	static async sendActive(currentUser) {
		//dựa vào accountId, tìm Email rồi gửi mã xác nhận
		const ErrorsList = [];
		const sendActiveErrors = errorListConstant.userErrorsConstant;
		const foundUser = await User.findUserByPKUsingExclude(currentUser.id);

		if (!foundUser) {
			ErrorsList.push(sendActiveErrors.USER_NOT_FOUND);
			return ErrorsList;
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

	//xin lại token
	static async reGenerateToken(currentUser) {
		const result = await User.findUserByPKUsingExclude(currentUser.id);
		const token = jwtHelper.generateToken(result);
		return { token };
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

			await audit_logService.pushAuditLog_ApproveIdCard(currentUser, foundUser, newApprove);

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

		var newEnableNoti = request.enableNoti;
		if (!newEnableNoti) newEnableNoti = user.enableNoti;
		else {
			newEnableNoti = parseInt(request.enableNoti);
			if (newEnableNoti !== 1 && newEnableNoti !== 0) newEnableNoti = user.enableNoti;
		}

		var newDateOfBirth = request.dateOfBirth;
		if (!newDateOfBirth) {
			newDateOfBirth = user.dateOfBirth;
			newDateOfBirth = moment(newDateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss');
		} else {
			//chỉ format khi và chỉ khi khác data cũ, hạn chế xài format tránh lỗi
			newDateOfBirth = moment(request.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss');
		}

		//tiếp đến là các thông tin quan trọng: username, email, phoneNumber...
		//cmnd sử dụng form khác, api riêng nên ko dùng ở đây

		var newPhoneNumber = request.phoneNumber;
		if (newPhoneNumber && newPhoneNumber != user.phoneNumber) {
			//Kiểm tra SDT trùng
			var isConflict = await User.checkConflictPhoneNumber(newPhoneNumber);
			setTimeout(function() {}, 500);
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
			setTimeout(function() {}, 500);
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
			setTimeout(function() {}, 500);
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

		// //phần mật khẩu: không update logic chung các thông tin khác, chỉ update khi thực sự đổi
		// if (request.currentPassword && request.currentPassword !== '') {
		// 	//nếu có nhập mk cũ đúng thì mới tiến hành xem xét mk mới
		// 	const newPassword = request.newPassword;
		// 	const confirmPassword = request.confirmPassword;
		// 	if (await User.verifyPassword(request.currentPassword, user.password)) {
		// 		if (newPassword !== confirmPassword) {
		// 			errorList.push(updateSelfInfoErrors.PASSWORD_NOT_EQUAL);
		// 		} else if (newPassword.length < 8) {
		// 			errorList.push(updateSelfInfoErrors.PASSWORD_TOO_SHORT);
		// 		} else {
		// 			await User.update(
		// 				{
		// 					password: await User.hashPassword(newPassword)
		// 				},
		// 				{
		// 					where: {
		// 						id: user.id
		// 					}
		// 				}
		// 			);
		// 		}
		// 	} else {
		// 		errorList.push(updateSelfInfoErrors.WRONG_PASSWORD);
		// 	}
		// }

		if (errorList.length > 0) return errorList;

		await User.update(
			{
				email: newEmail,
				address: newAddress,
				lastName: newLastName,
				firstName: newFirstName,
				enable2fa: newEnable2fa,
				enableNoti: newEnableNoti, // chỉ nhận 0 và 1
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

	//nhân viên update thông tin cá nhân người dùng
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
			newDateOfBirth = moment(newDateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss');
		} else {
			//chỉ format khi và chỉ khi khác data cũ, hạn chế xài format tránh lỗi
			newDateOfBirth = moment(request.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss');
		}

		var newEmail = request.email;
		//nếu ng dùng có nhập email và khác email cũ
		if (newEmail && newEmail != user.email) {
			//Kiểm tra trùng với ng khác
			var isConflict = await User.checkConflictEmail(newEmail);
			setTimeout(function() {}, 500);
			if (isConflict) {
				errorList.push(updateUserInfoErrors.EMAIL_CONFLICT);
			}

			//gửi email cho email cũ
			makeMessageHelper.changeEmailByStaffMessage(user.lastName, user.firstName, user.email, newEmail, function(
				response
			) {
				emailHelper.send(user.email, 'Thay đổi Email', response.content, response.html, response.attachments);
			});
		} else {
			//nếu ng dùng ko nhập email và các TH còn lại
			newEmail = user.email;
		}

		var newUsername = request.username;
		if (newUsername && newUsername != user.username) {
			//Kiểm tra trùng với ai khác
			var isConflict = await User.checkConflictUserName(newUsername);
			setTimeout(function() {}, 500);
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
			setTimeout(function() {}, 500);
			if (isConflict) {
				errorList.push(updateUserInfoErrors.PHONENUMBER_CONFLICT);
			}
		} else {
			newPhoneNumber = user.phoneNumber;
		}

		var newCitizenIdentificationId = request.citizenIdentificationId;
		var newIssueDate = request.issueDate;
		if (!newIssueDate) newIssueDate = user.issueDate;
		var newIdentificationType = request.identificationType;
		if (!newIdentificationType && newIdentificationType !== 'CMND' && newIdentificationType !== 'CCCD') {
			newIdentificationType = user.identificationType;
		}

		if (newCitizenIdentificationId && newCitizenIdentificationId != user.citizenIdentificationId) {
			//Kiểm tra CMND trùng
			var isConflict = await User.checkConflictCitizenIdentificationId(newCitizenIdentificationId);
			setTimeout(function() {}, 500);
			if (isConflict) {
				errorList.push(updateUserInfoErrors.CITIZENIDENTIFICATIONID_CONFLICT);
			}
		} else {
			newCitizenIdentificationId = user.citizenIdentificationId;
		}

		if (errorList.length > 0) return errorList;

		if (user.citizenIdentificationId && user.citizenIdentificationId !== '' && newCitizenIdentificationId) {
			await citizenService.createOrUpdateCitizen(
				user.citizenIdentificationId,
				newIdentificationType,
				newIssueDate,
				newCitizenIdentificationId
			);
		}

		//nếu người dc update là nhân viên thì sẽ ko tự khóa
		//vẫn được tự hạ chức
		if (user.userType === 0) {
			newStatus = 1;
			newApprove = 1;
		}

		//update thông tin user
		await User.update(
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
				approveStatus: newApprove
			},
			{
				where: { id: userId }
			}
		);

		await audit_logService.pushAuditLog_EditUser(currentUser, user);

		//send email ở đây
		if (user.enableNoti == 1) {
			makeMessageHelper.editUserMessage(
				user.lastName,
				user.firstName,
				currentUser.lastName,
				currentUser.firstName,
				currentUser.email,
				function(response) {
					emailHelper.send(
						user.email,
						'Thay đổi thông tin cá nhân',
						response.content,
						response.html,
						response.attachments
					);
				}
			);
		}

		return null;
	}

	//nhân viên update account người dùng
	static async updateAccountInfo(request, currentUser) {
		const result = await accountService.updateAccount(request);

		if (result) {
			const foundUser = await User.findUserByPKNoneExclude(result.userId);
			await audit_logService.pushAuditLog_EditAccount(currentUser, foundUser, result.accountId);

			if (foundUser.enableNoti == 1) {
				makeMessageHelper.editAccountMessage(
					foundUser.lastName,
					foundUser.firstName,
					result.accountId,
					currentUser.lastName,
					currentUser.firstName,
					currentUser.email,
					function(response) {
						emailHelper.send(
							foundUser.email,
							'Chinh sửa số tài khoản',
							response.content,
							response.html,
							response.attachments
						);
					}
				);
			}
		}

		return result;
	}

	//nhân viên nạp tiền cho người dùng
	static async loadUpBalance(request, currentUser) {
		//có lỗi sẽ trả ra, nếu null là ko có lỗi
		const result = await accountService.addBalanceForAccount(request);
		if (result) return result;

		const foundAccount = await accountService.getAccountNoneExclude(request.accountId);
		const foundUser = await User.findUserByPKNoneExclude(foundAccount.userId);

		//gửi email
		makeMessageHelper.loadUpSuccessMessage(
			foundUser.email,
			request.accountId,
			foundUser.lastName,
			foundUser.firstName,
			request.balance,
			request.currencyType,
			foundAccount.currencyType,
			foundAccount.balance,
			function(response) {
				emailHelper.send(
					foundUser.email,
					'Nạp tiền thành công',
					response.content,
					response.html,
					response.attachments
				);
			}
		);
		await account_logService.pushAccountLog_loadUp(
			foundAccount.accountId,
			request.balance,
			request.currencyType,
			'',
			1
		);

		await audit_logService.pushAuditLog_AddBalance(
			currentUser,
			foundUser,
			request.balance,
			request.currencyType,
			foundAccount.accountId
		);

		return null;
	}

	//chỉ nhân viên được rút tiền
	//rút tiền: dùng chung cho tk thanh toán và tiết kiệm
	static async withdrawStepTwo(request, currentUser) {
		const ErrorsList = [];
		const withdrawStepTwoErrors = errorListConstant.accountErrorsConstant;
		const accountId = request.accountId;

		const foundAccount = await accountService.getAccountNoneExclude(accountId);
		const message = request.message || '';

		if (!foundAccount) {
			ErrorsList.push(withdrawStepTwoErrors.ACCOUNT_NOT_FOUND);
			return ErrorsList;
		}

		if (foundAccount.status !== 1) {
			ErrorsList.push(withdrawStepTwoErrors.SELF_LOCKED);
			return ErrorsList;
		}

		const foundUser = await User.findUserByPKNoneExclude(foundAccount.userId);

		if (!foundUser) {
			ErrorsList.push(errorListConstant.userErrorsConstant.VERIFYCODE_INVALID);
			return ErrorsList;
		}

		// //Nếu thằng đang đăng nhập không sở hữu tài khoản thì xóa mã verify rồi cút nó ra
		// if (foundUser.id !== currentUser.id || parseInt(foundAccount.userId) !== currentUser.id) {
		// 	ErrorsList.push(withdrawStepTwoErrors.NOT_BELONG);
		// 	return ErrorsList;
		// }

		//nếu là tài khoản tiết kiệm
		if (foundAccount.accountType === 1) {
			//gọi hàm rút tiền của tài khoản tiết kiệm
			const result = await accountService.withdrawForAccumulatedAccount(foundAccount);
			if (result) {
				await account_logService.pushAccountLog_withdraw(
					1,
					foundAccount.accountId,
					parseFloat(result.balance) + parseFloat(result.profit),
					foundAccount.currencyType,
					message,
					1
				);

				//gửi email
				makeMessageHelper.withdrawMessageAccumulated(
					foundUser.email,
					foundUser.lastName,
					foundUser.firstName,
					result.balance,
					result.profit,
					result.accountId,
					result.totalDaysPassed,
					result.term,
					foundAccount.startTermDate,
					0,
					foundAccount.currencyType,
					message,
					function(response) {
						emailHelper.send(
							foundUser.email,
							'Rút tiền thành công',
							response.content,
							response.html,
							response.attachments
						);
					}
				);

				await audit_logService.pushAuditLog_Withdraw(
					currentUser,
					foundUser,
					parseFloat(result.balance) + parseFloat(result.profit),
					foundAccount.currencyType,
					foundAccount.accountId
				);

				return null;
			}
		} else {
			//nếu là tài khoản thanh toán, gọi hàm rút tiền của tài khoản thanh toán
			const valueWithdraw = request.value;
			if (!await User.isNumber(valueWithdraw) || !valueWithdraw) {
				ErrorsList.push(withdrawStepTwoErrors.MONEY_INVALID);
				return ErrorsList;
			} else if (parseFloat(valueWithdraw) <= 0.0) {
				ErrorsList.push(withdrawStepTwoErrors.MONEY_INVALID);
				return ErrorsList;
			}

			if (
				parseFloat(valueWithdraw) > parseFloat(foundAccount.balance) ||
				parseFloat(foundAccount.balance) <= 0.0
			) {
				ErrorsList.push(withdrawStepTwoErrors.NOT_ENOUGH_WITHDRAW);
				return ErrorsList;
			}
			const result = await accountService.withdrawForPaymentAccount(foundAccount, valueWithdraw);
			if (result) {
				await account_logService.pushAccountLog_withdraw(
					0,
					foundAccount.accountId,
					valueWithdraw,
					foundAccount.currencyType,
					message,
					1
				);

				//gửi email
				makeMessageHelper.withdrawMessagePayment(
					foundUser.lastName,
					foundUser.firstName,
					foundAccount.accountId,
					valueWithdraw,
					foundAccount.currencyType,
					result,
					message,
					function(response) {
						emailHelper.send(
							foundUser.email,
							'Rút tiền thành công',
							response.content,
							response.html,
							response.attachments
						);
					}
				);

				//push log
				await audit_logService.pushAuditLog_Withdraw(
					currentUser,
					foundUser,
					valueWithdraw,
					foundAccount.currencyType,
					foundAccount.accountId
				);

				return null;
			}
		}

		return ErrorsList;
	}

	//chuyển tiền nội bộ
	static async transferInternalStepTwo(request, currentUser) {
		var message = request.message;
		if (!message || message == ' ' || message == '') message = '';
		const ErrorsList = [];
		const errorListTransfer = errorListConstant.accountErrorsConstant;
		const userTransferErrors = errorListConstant.userErrorsConstant;
		const requestAccountId = request.requestAccountId; //currentUser's accountId
		const accountId = request.accountId; //Destination accountId
		var money = new Decimal(request.money); //tiền để tính toán ở bên gửi
		var transferMoney = new Decimal(request.money); //tiền để tính toán ở bên nhận
		const foundAccount = await accountService.getAccountNoneExclude(requestAccountId);

		if (!await User.isNumber(request.money) || !request.money) {
			ErrorsList.push(withdrawStepTwoErrors.MONEY_INVALID);
			return ErrorsList;
		}

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
			const checkLimit = await account_logService.checkAccountOverLimitTransfer(
				foundAccount,
				money,
				foundAccount.currencyType
			);
			if (checkLimit === 'transfer') {
				ErrorsList.push(errorListTransfer.LIMIT_TRANSFER);
				return ErrorsList;
			} else if (checkLimit === 'day') {
				ErrorsList.push(errorListTransfer.LIMIT_DAY);
				return ErrorsList;
			} else if (checkLimit === 'month') {
				ErrorsList.push(errorListTransfer.LIMIT_MONTH);
				return ErrorsList;
			}
		} else {
			//nếu bên gửi xài đơn vị VND thì khỏi đổi về TẠM THỜI
			if (parseFloat(money) < 20000) {
				ErrorsList.push(errorListTransfer.REQUIRE_MINIMUM);
				return ErrorsList;
			}
			//kiểm tra giới hạn đơn vị giao dịch...
			const checkLimit = await account_logService.checkAccountOverLimitTransfer(
				foundAccount,
				money,
				foundAccount.currencyType
			);
			if (checkLimit === 'transfer') {
				ErrorsList.push(errorListTransfer.LIMIT_TRANSFER);
				return ErrorsList;
			} else if (checkLimit === 'day') {
				ErrorsList.push(errorListTransfer.LIMIT_DAY);
				return ErrorsList;
			} else if (checkLimit === 'month') {
				ErrorsList.push(errorListTransfer.LIMIT_MONTH);
				return ErrorsList;
			}
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
		var newFee = await accountService.feeCalculateForPayment(requestAccountId, money, 1);

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

		await account_logService.pushAccountLog_transfer(
			'',
			foundAccount.accountId,
			foundAccountDes.accountId,
			money,
			foundAccount.currencyType,
			message,
			1
		);

		makeMessageHelper.transferSuccessMessage(
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
			foundUserDes.lastName,
			foundUserDes.firstName,
			money,
			foundAccount.accountId,
			foundAccountDes.accountId,
			newBalanceDes,
			foundAccount.currencyType,
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

	//hàm chuyển tiền liên ngân hàng
	static async transferExternalStepTwo(request, currentUser, res) {
		const ErrorsList = [];
		const errorListTransfer = errorListConstant.accountErrorsConstant;
		const userTransferErrors = errorListConstant.userErrorsConstant;

		const requestAccountId = request.requestAccountId;
		const bankId = request.bankId;
		var money = new Decimal(request.money);
		var message = request.message || '';

		if (!await User.isNumber(request.money) || !request.money) {
			ErrorsList.push(withdrawStepTwoErrors.MONEY_INVALID);
			return ErrorsList;
		}

		const foundAccount = await accountService.getAccountNoneExclude(requestAccountId);
		const foundBank = await whitelistService.findOne({
			where: {
				bankId: bankId
			}
		});

		if (!foundBank) {
			ErrorsList.push(errorListTransfer.BANK_NOT_FOUND);
			return res.status(400).send(ErrorsList);
		}

		// cho phép tài khoản gửi và nhận là 1 vì khác ngân hàng mà
		// if (requestAccountId === accountId) {
		// 	ErrorsList.push(errorListTransfer.SELF_DETECT);
		// 	return res.status(400).send(ErrorsList);
		// }

		//nếu không tìm thấy hoặc tài khoản bên gửi không thuộc loại thanh toán
		if (!foundAccount || foundAccount.accountType !== 0) {
			ErrorsList.push(errorListTransfer.SELF_NOT_EXISTS);
			return res.status(400).send(ErrorsList);
		}

		//nếu tài khoản bên gửi đang bị khóa (1 là OK, 0 closed, 2là locked)
		if (foundAccount.status !== 1) {
			ErrorsList.push(errorListTransfer.SELF_LOCKED);
			return res.status(400).send(ErrorsList);
		}

		if (foundAccount.currencyType !== 'VND') {
			//đổi toàn bộ tiền gửi dạng USD(money) sang tiền VND(tempMoney)
			var tempMoney = await exchange_currencyService.exchangeMoney(money, foundAccount.currencyType);

			//nếu mệnh giá < 20k
			if (parseFloat(tempMoney) < 20000) {
				ErrorsList.push(errorListTransfer.REQUIRE_MINIMUM);
				return res.status(400).send(ErrorsList);
			}
			//kiểm tra giới hạn đơn vị giao dịch...
			const checkLimit = await account_logService.checkAccountOverLimitTransfer(
				foundAccount,
				money,
				foundAccount.currencyType
			);
			if (checkLimit === 'transfer') {
				ErrorsList.push(errorListTransfer.LIMIT_TRANSFER);
				return res.status(400).send(ErrorsList);
			} else if (checkLimit === 'day') {
				ErrorsList.push(errorListTransfer.LIMIT_DAY);
				return res.status(400).send(ErrorsList);
			} else if (checkLimit === 'month') {
				ErrorsList.push(errorListTransfer.LIMIT_MONTH);
				return res.status(400).send(ErrorsList);
			}
		} else {
			//nếu bên gửi xài đơn vị VND thì khỏi đổi về TẠM THỜI
			if (parseFloat(money) < 20000) {
				ErrorsList.push(errorListTransfer.REQUIRE_MINIMUM);
				return res.status(400).send(ErrorsList);
			}
			//kiểm tra giới hạn đơn vị giao dịch...
			const checkLimit = await account_logService.checkAccountOverLimitTransfer(
				foundAccount,
				money,
				foundAccount.currencyType
			);
			if (checkLimit === 'transfer') {
				ErrorsList.push(errorListTransfer.LIMIT_TRANSFER);
				return res.status(400).send(ErrorsList);
			} else if (checkLimit === 'day') {
				ErrorsList.push(errorListTransfer.LIMIT_DAY);
				return res.status(400).send(ErrorsList);
			} else if (checkLimit === 'month') {
				ErrorsList.push(errorListTransfer.LIMIT_MONTH);
				return res.status(400).send(ErrorsList);
			}
		}

		//xác thực verifyCode...
		const checkingUser = await User.activeVerifyCode(request.verifyCode);

		if (!checkingUser) {
			ErrorsList.push(userTransferErrors.VERIFYCODE_INVALID);
			return res.status(400).send(ErrorsList);
		}

		//Nếu thằng đang đăng nhập không sở hữu tài khoản bên gửi thì xóa mã verify rồi cút nó ra
		if (checkingUser.id !== currentUser.id || parseInt(foundAccount.userId) !== currentUser.id) {
			ErrorsList.push(errorListTransfer.NOT_BELONG);
			return res.status(400).send(ErrorsList);
		}

		//0 là liên ngân hàng, 1 là nội bộ
		var newFee = await accountService.feeCalculateForPayment(requestAccountId, money, 0);

		//tổng tiền tiêu hao bên gửi (sẽ trừ cái này nếu chuyển thành công)
		//nếu tài khoản bên gửi VND: thì tổng = value(VND)+fee(VND)
		//nếu tài khoản bên gửi USD: thì tổng = value(USD)+fee(USD)
		var totalConsumeMoney = new Decimal(newFee).plus(money);
		var newBalance = new Decimal(foundAccount.balance).sub(totalConsumeMoney);
		if (parseFloat(totalConsumeMoney) > parseFloat(foundAccount.balance)) {
			ErrorsList.push(errorListTransfer.NOT_ENOUGH);
			return res.status(400).send(ErrorsList);
		}
		requestService.post(
			{
				headers: { clientid: foundBank.dataValues.clientId, secretkey: foundBank.dataValues.secretKey },
				url: foundBank.dataValues.URL,
				form: {
					accountId: request.accountId,
					requestAccountId: request.requestAccountId,
					bankId: 'wfb',
					bankSecretKey: '12345',
					money: request.money,
					currency: foundAccount.currencyType,
					message: message
				}
			},
			async function(err, response, body) {
				const result = JSON.parse(body);

				if (result == 0) {
					//cập nhật tiền, push log và send mail
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

					await account_logService.pushAccountLog_transfer(
						bankId,
						request.requestAccountId,
						request.accountId,
						request.money,
						foundAccount.currencyType,
						message,
						1
					);

					makeMessageHelper.transferSuccessMessage(
						checkingUser.lastName,
						checkingUser.firstName,
						request.money,
						newFee,
						request.requestAccountId,
						request.accountId + ' (Ngân hàng ' + bankId + ')',
						newBalance,
						foundAccount.currencyType,
						message,
						function(response) {
							emailHelper.send(
								checkingUser.email,
								'Chuyển tiền thành công',
								response.content,
								response.html,
								response.attachments
							);
						}
					);
				} else {
					console.log('failed');
					//push lỗi, không cập nhật tiền, không send mail
					await account_logService.pushAccountLog_transfer(
						bankId,
						request.requestAccountId,
						request.accountId,
						request.money,
						foundAccount.currencyType,
						message,
						0
					);
				}
			}
		);
		return res.status(200).send({ message: 'OK' });
	}

	//hàm lắng nghe chuyển khoản liên ngân hàng (nhận CK liên ngân hàng)
	static async listenExternal(request) {
		const accountId = request.accountId;
		var message = request.message;
		if (!message) message = '';

		// 'Bạn nhận được tiền được chuyển liên ngân hàng, từ ' +
		// request.bankId +
		// ', Người này không để lại lời nhắn gì thêm.';
		const foundAccount = await accountService.getAccountNoneExclude(accountId);
		if (!foundAccount) return null;
		const result = await accountService.listenExternal_account(foundAccount, request);

		if (result === 0) {
			//gửi mail cho người nhận
			const foundUser = await User.findUserByPKNoneExclude(parseInt(foundAccount.userId));
			const finalAccount = await accountService.getAccountNoneExclude(accountId);
			const requestAccountId = request.requestAccountId + ' (Ngân Hàng ' + request.bankId + ')';

			makeMessageHelper.transferSuccessMessageDes(
				foundUser.lastName,
				foundUser.firstName,
				request.money,
				requestAccountId,
				accountId,
				finalAccount.balance,
				request.currency,
				finalAccount.currencyType,
				message,
				function(response) {
					emailHelper.send(
						foundUser.email,
						'Nhận tiền thành công',
						response.content,
						response.html,
						response.attachments
					);
				}
			);

			await account_logService.pushAccountLog_transfer(
				request.bankId,
				request.requestAccountId,
				request.accountId,
				request.money,
				request.currency,
				message,
				1
			);
		}

		return result;
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
			defaultValue: ''
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
			//postgre khi input date chỉ nhận 2 dạng: YYYY-MM-DD HH:mm:ss và MM-DD-YYYY HH:mm:ss (dấu - hoặc /)
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

		enableNoti: {
			type: Sequelize.INTEGER, //1 là có kích hoạt gửi mail thông báo bảo mật
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
