require('./db');

'use strict';

const config = require('./lib/config');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const mailer = require('express-mailer');
const flash = require('connect-flash');
const http = require('http');
const querystring = require('querystring');
const connect = require('connect');
const helpers = require('./helpers');
const nunjucks = require('nunjucks');
const path = require('path');
const views = require('./views');
const csv = require('csv');

const passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy;

const mongo = require('mongodb');
const monk = require('monk');
var rdb = (process.env.MONGOLAB_URI !== undefined) ? process.env.MONGOLAB_URI : 'mongodb://localhost/badge-the-world';
const db = monk(rdb);

const app = express();
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname, 'templates')), {autoescape: true});
env.express(app);

var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })

mailer.extend(app, {
	from: 'no-reply@badgetheworld.org',
	host: 'smtp.gmail.com', // hostname 
	secureConnection: true, // use SSL 
	port: 465, // port for secure SMTP 
	transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts 
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWD
	}
});

// Bootstrap the app for reversible routing, and other niceties
require('../lib/router.js')(app);

/* ----------- Handle static location ----------- */
var staticDir = path.join(__dirname, '/static');
var staticRoot = '/static';

app.use(function (req, res, next) {
	req.db = db;
	res.locals.static = function static (staticPath) {
		return path.join(app.mountPoint, staticRoot, staticPath).replace(/\\/g,'/');
	}
	next();
});

app.use(express.compress());
app.use(connect());
app.use(express.bodyParser());
app.use(cookieParser());
app.use(session({
	secret: 'mysecret',
	saveUninitialized: true,
	resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(helpers.addMessages);

var initPassport = require('./passport/init');
initPassport(passport);

app.use(staticRoot, express.static(staticDir));

app.get('/', function(req, res) {

	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	res.render('core/home.html', {
		pledge : qs.pledge
	});

});
app.get('/pledge', csrfProtection, function(req, res) {
	res.render('core/pledge.html', {});
});
app.get('/contact', 'contact', views.contact);
app.get('/info', 'info', views.info);
app.post('/createPledge', function(req, res) {

	var mongoose = require('mongoose');
	var Pledge   = mongoose.model('Pledge');

	var fiveWays = [];
	if (req.body.createBadge) fiveWays.push("Create or Design Badges");
	if (req.body.issueBadge) fiveWays.push("Issue Badges");
	if (req.body.displayBadge) fiveWays.push("Display Badges");
	if (req.body.researchBadge) fiveWays.push("Research Badges");
	if (req.body.joinBadge) fiveWays.push("Join the Badging Conversation");

	var share = [];
	if (req.body.shareCaseStyudy) share.push("Share case study");
	if (req.body.shareOB) share.push("Share OB with your network");

	new Pledge({
		fiveWays: fiveWays.join(", "),
		idea : (req.body.idea ? req.body.idea : ""),
		numberOfPeople : (req.body.numberOfPeople ? req.body.numberOfPeople : ""),
		location : (req.body.location ? req.body.location : ""),
		postcode : (req.body.postcode ? req.body.postcode : ""),
		email : (req.body.email ? req.body.email : ""),
		name : (req.body.name ? req.body.name : ""),
		twitterHandle : (req.body.twitterHandle ? req.body.twitterHandle : ""),
		organisation : (req.body.organisation ? req.body.organisation : ""),
		share : share.join(", "),
		subscribe : (req.body.subscribe ? true : false),
		created_at : Date.now()
	}).save( function( err, pledge, count ){
		if (err) {
			console.log(err);
		} else {
			sendEmail(res, pledge, function(res) {
				console.log(pledge)
				res.redirect('/share?pledge=' + pledge._id);
			});			
		}		
	});

});
app.get('/share', function(req, res) {
	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	res.render('core/share.html', {
		pledge : qs.pledge
	});
});
app.get('/pledges', function(req, res) {
	var collection = db.get('pledges');
		collection.find({},{},function(e,data){
			res.setHeader('Content-Type', 'application/json');
			return res.send(JSON.stringify(data));
		});
});
app.get('/admin', function(req, res) {
	// console.log(req.session)
	res.render('core/admin.html', {
		user: req.user
	});
});
app.post('/login', passport.authenticate('login', {
	successRedirect: '/admin',
	failureRedirect: '/admin',
	failureFlash: true 
}));
app.post('/signup', passport.authenticate('signup', {
	successRedirect: '/',
	failureRedirect: '/admin',
	failureFlash : true  
}));
app.get('/logout', function(req, res){

	if (req.user) {
		var name = req.user.username;
		console.log("LOGGING OUT " + req.user.username)
		req.logout();
	}
	res.redirect('/');
	req.session.notice = "You have successfully been logged out " + name + "!";
});

app.get('/download', function(req, res) {
	var collection = db.get('pledges');
	collection.find({},{fields: {_id: 0, subscribe: 0, __v: 0}},function(e,data){

		var headers = { fiveWays: '5 ways to pledge to become a Badge partner',
				idea: 'Tell us about your badging ideas',
				numberOfPeople: 'How many people will your badging efforts impact?',
				location: 'Location',
				postcode: 'Zip/Postcode',
				email: 'Email Address',
				name: 'Name',
				twitterHandle: 'Twitter Username',
				organisation: 'Organisation',
				share: 'Share',
				created_at: "Date of pledge",
		}

		for (var i = data.length - 1; i >= 0; i--) {
			var date = new Date(data[i].created_at);
			date = date.toISOString().substr(0, 19).replace('T', ' ');
			data[i].created_at = date;
		};

		data.unshift(headers);

		res.attachment('pledges.csv');
		res.setHeader('Content-Type', 'text/csv');
		res.end(csv().from(data).to(res));
	});
});

app.get('*', function(req, res){
	res.send('This page does not exist', 404);
});


if (!module.parent) {
	var port = config('PORT', 3099);

	app.listen(port, function(err) {
		if (err) throw err;
		console.log("Listening on port " + port + ".");
	});
} else {
	module.exports = http.createServer(app);
}

var sendEmail = function(res, pledge, callback) {
	app.mailer.send('core/email.html', {
		to: 'keith@bluemantis.com', // REQUIRED. This can be a comma delimited string just like a normal email to field. 
		subject: 'New Pledge!', // REQUIRED.
		pledge: pledge,
	}, function (err) {
		if (err) {
			// handle error
			console.log(err);
			res.send('There was an error sending the email');
			return;
		}
		if (callback && typeof(callback) == "function") {
			callback(res);
		}
	});
}