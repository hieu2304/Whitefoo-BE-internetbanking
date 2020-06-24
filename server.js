//modules & server constants
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const db = require('./services/db');
const errorHandler = require('./helpers/error.helper');
const jwt = require('./helpers/jwt.helper');
const authMiddleware = require('./middlewares/auth.middleware');
const port = process.env.PORT || 3000;

app.use(
	cookieSession({
		name: 'whitefoo',
		keys: [ 'whitefoo' ],
		maxAge: 24 * 60 * 60 * 1000 //24 hours
	})
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(errorHandler);

//FrontEnd yêu cầu
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

//middleware secret key, này sẽ luôn dùng, 1 addition Authentication ngoài JWT
app.use(authMiddleware.authSecret);

//các API routes không cần JWT
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/register', require('./routes/register.route'));
app.use('/api/upload', require('./routes/upload.route'));

//các API cần JWT
app.use(jwt.authToken);

app.use('/api/post', require('./routes/post.route'));
app.use('/api/token', require('./routes/token.route'));

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
