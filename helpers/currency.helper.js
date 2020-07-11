const request = require('request');
const moment = require('moment');

/*

READ THE API FORM THE THIRD SERVER:
https://www.freeforexapi.com/Home/Api

SPECIAL THANKS TO FREEFOREXAPI

*/

module.exports.getNewExchangeRate = function() {
	const myurl = 'https://www.freeforexapi.com/api/live?pairs=USDVND';
	request(myurl, function(err, respone, body) {
		body = JSON.parse(body);
		const data = body.rates.USDVND;
		var mydate = new Date(data.timestamp * 1000);
		var newDate = moment(mydate).format('DD-MM-YYYY hh:mm:ss');

		return { rate: data.rate, time: newDate };
	});
};
