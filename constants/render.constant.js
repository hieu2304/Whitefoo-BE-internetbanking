//dùng để render cho FE xài
module.exports.userRender = {
	userType: {
		'1': 'user',
		'0': 'manager'
	},
	status: {
		'1': 'OK',
		'0': 'locked'
	}
};

module.exports.accountRender = {
	status: {
		'1': 'OK',
		'0': 'locked'
	},
	accountType: {
		'1': 'accumulated',
		'0': 'payment'
	}
};

//dùng chung cho fee_payment, payment history
module.exports.paymentRender = {
	transferType: {
		'1': 'internal transfer',
		'0': 'external transfer'
	},
	status: {
		'1': 'success',
		'0': 'fail'
	}
};

module.exports.history_accumulatedRender = {
	status: {
		'1': 'success',
		'0': 'fail'
	}
};
