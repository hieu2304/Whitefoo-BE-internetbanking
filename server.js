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

//huy yêu cầu
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

//middleware secret key
app.use(authMiddleware.authSecret);

//API routes không cần token
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/register', authMiddleware.logoutRequired, require('./routes/register.route'));

//API cần token
app.use(jwt.authToken);

app.use('/api/post', authMiddleware.loginRequired, require('./routes/post.route'));
app.use('/api/token', authMiddleware.loginRequired, require('./routes/token.route'));

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
