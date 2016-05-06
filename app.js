var express = require('express'),
	passport = require('passport'),
	Sequelize = require('sequelize'),

	path = require('path'),
	favicon = require('serve-favicon'),
	logger = require('morgan'),

	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),

	User = require('./models/user'),

	routes = require('./routes/index'),
	users = require('./routes/users'),

	app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// favicon and logger
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

// prepare session/cookie handling
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('connect-multiparty')());
app.use(cookieParser());

var secret = (process.env.SESSION_SECRET !== undefined) ? process.env.SESSION_SECRET : 'keyboard cat strikes again';
app.use(session({
	secret: secret,
	resave: false,
	saveUninitialized: false
}));

// initialize passport w/ session
app.use(passport.initialize());
app.use(passport.session());

// process routes prior to user auth and user session handling
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;
