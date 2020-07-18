//bảng whitelist, danh sách các ngân hàng co-op
module.exports.whitelistBaseValue = [
	{
		id: 1,
		bankId: 'ARG', //của Nhật
		bankSecretKey: '12345',
		clientId: 'temp',
		secretKey: 'temp2'
	}
];

//3.5% = 3.5/100 = 0.035
//bảng tính tỷ lệ chuyển đổi ngoại tệ và phí khi chuyển đổi
module.exports.exchange_currencyBaseValue = [
	{
		id: 1,
		unitA: 'USD',
		unitB: 'VND',
		rate: 23145.4,
		fee: 0.005
	},
	{
		id: 2,
		unitA: 'VND',
		unitB: 'USD',
		rate: 1 / 23145.4,
		fee: 0.005
	}
];

//bảng phí khi thanh toán/chuyển tiền bằng tài khoản thanh toán
// transferType: 1 chuyển nội bộ, 0 is chuyển liên ngân hàng
module.exports.fee_paymentBaseValue = [
	{
		id: 1,
		fee: 0,
		value: 500000, //x < 500k
		transferType: 1
	},
	{
		id: 2,
		fee: 7000,
		value: 500000, //x < 500k
		transferType: 0
	},
	{
		id: 3,
		fee: 5000,
		value: 10000000, //x < 10tr
		transferType: 1
	},
	{
		id: 4,
		fee: 10000,
		value: 10000000, //x < 10tr
		transferType: 0
	},
	{
		id: 5,
		fee: 0.0005, //0.05%
		value: 50000000, //x < 50tr
		transferType: 1
	},
	{
		id: 6,
		fee: 0.002, //0.2%
		value: 50000000, //x < 50tr
		transferType: 0
	},
	{
		id: 7,
		fee: 0.0007, //0.07%
		value: 150000000, //x < 150tr
		transferType: 1
	},
	{
		id: 8,
		fee: 0.003, //0.3%
		value: 150000000, //x < 150tr
		transferType: 0
	},
	{
		id: 9,
		fee: 0.001, //0.1%
		value: 150000001, //x >= 150tr
		transferType: 1
	},
	{
		id: 10,
		fee: 0.004, //0.4%
		value: 150000001, //x >= 150tr
		transferType: 0
	}
];

//bảng lãi suất của tài khoản tiết kiệm
module.exports.law_accumulatedBaseValue = [
	{
		id: 1,
		term: 3,
		interestMonth: 0.035,
		interestQuarterYear: 0,
		interestTerm: 0.04
	},
	{
		id: 2,
		term: 6,
		interestMonth: 0.0375,
		interestQuarterYear: 0.04,
		interestTerm: 0.0425
	},
	{
		id: 3,
		term: 12,
		interestMonth: 0.04,
		interestQuarterYear: 0.0425,
		interestTerm: 0.05
	},
	{
		id: 4,
		term: 18,
		interestMonth: 0.0425,
		interestQuarterYear: 0.045,
		interestTerm: 0.0525
	},
	{
		id: 5,
		term: 24,
		interestMonth: 0.05,
		interestQuarterYear: 0.0525,
		interestTerm: 0.0625
	},
	{
		id: 6,
		term: 30,
		interestMonth: 0.0525,
		interestQuarterYear: 0.055,
		interestTerm: 0.0675
	},
	{
		id: 7,
		term: 36,
		interestMonth: 0.0575,
		interestQuarterYear: 0.06,
		interestTerm: 0.075
	}
];

//bảng giới hạng thanh toán/chuyển khoản
module.exports.law_paymentBaseValue = [
	{
		id: 1,
		unit: 'transfer',
		limit: 200000000
	},
	{
		id: 2,
		unit: 'day',
		limit: 500000000
	},
	{
		id: 3,
		unit: 'month',
		limit: 10000000000
	}
];
