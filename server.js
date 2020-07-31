//modules & server constants
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');
const db = require('./services/db');
const errorHandler = require('./helpers/error.helper');
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(errorHandler);

//FrontEnd yêu cầu
app.use(cors());

//tránh lỗi khi deploy
app.use('/', require('./routes/index.route'));

//API
app.use('/api', require('./api'));

//server
db
	.sync()
	.then(function() {
		app.listen(port);
		console.log(`\nServer is listening on port ${port}\n`);
	})
	.catch(function(err) {
		console.error(err);
	});
