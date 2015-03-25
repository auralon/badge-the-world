const db = require('./db');

'use strict';

var rdb = (process.env.MONGOLAB_URI !== undefined) ? process.env.MONGOLAB_URI : 'mongodb://localhost/badge-the-world';

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
const helpers = require('./helpers');
const nunjucks = require('nunjucks');
const path = require('path');
const views = require('./views');
const csv = require('csv');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const mongo = require('mongodb');

var csrfProtection = csrf({ cookie: false });
var parseForm = bodyParser.urlencoded({ extended: true });

const app = express();
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname, 'templates')), {autoescape: true});
env.express(app);

mailer.extend(app, {
	from: 'no-reply@badgetheworld.org',
	host: 'smtp.gmail.com', // hostname
	secureConnection: true, // use SSL
	port: 465, // port for secure SMTP
	transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
	auth: {
		// user: process.env.SMTP_USER,
		// pass: process.env.SMTP_PASSWD
		user: "kbluemantis@gmail.com",
		pass: "lTydwIiAi3OGcf7OgjldlxREgEiE7H5H"
	}
});

// Bootstrap the app for reversible routing, and other niceties
require('../lib/router.js')(app);

/* ----------- HANDLE STATIC LOCATION ----------- */
var staticDir = path.join(__dirname, '/static');
var staticRoot = '/static';

app.use(function (req, res, next) {
	req.db = db.db;
	res.locals.static = function static (staticPath) {
		return path.join(app.mountPoint, staticRoot, staticPath).replace(/\\/g,'/');
	}
	next();
});

app.use(express.compress());
app.use(express.bodyParser());
app.use(cookieParser());
app.use(session({
	secret: 'mysecret',
	saveUninitialized: true,
	resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf());
app.use(flash());
app.use(helpers.addMessages);

var initPassport = require('./passport/init');
initPassport(passport);

app.use(staticRoot, express.static(staticDir));



/* ----------- ROUTING ----------- */
app.get('/', function(req, res) {

	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	res.render('core/home.html', {
		pledge : qs.pledge
	});

});
app.get('/pledge', csrfProtection, function(req, res) {
	res.render('core/pledge.html', {
		csrfToken: req.csrfToken()
	});
});
app.get('/contact', 'contact', views.contact);
app.get('/info', 'info', views.info);
app.post('/createPledge', csrfProtection, function(req, res) {

	var Pledge   = db.db.model('Pledge');

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
		location : (req.body.address ? req.body.address : ""),
		lat: (req.body.lat ? req.body.lat : ""),
		lon: (req.body.lon ? req.body.lon : ""),
		email : (req.body.email ? req.body.email : ""),
		name : (req.body.name ? req.body.name : ""),
		twitterHandle : (req.body.twitterHandle ? req.body.twitterHandle : ""),
		organisation : (req.body.organisation ? req.body.organisation : ""),
		share : share.join(", "),
		subscribe : (!req.body.subscribe ? "true" : "false"),
		created_at : Date.now()
	}).save( function( err, pledge, count ){
		if (err) {
			console.log(err);
		} else {
			sendEmail(res, pledge, function(res) {
				console.log(pledge)
				res.redirect('/share?pledge=' + pledge.uid);
			});
		}
	});

});
app.post('/updatePledge', csrfProtection, function(req, res) {
	if (req.user) {

		var pledge = Pledge.findOne({ uid: req.body.id}, function (err, doc){

			if (err) {
				console.log(err);
				res.send('There was an error updating the pledge');
				return;
			}

			var fiveWays = [];
			if (req.body.createBadge) fiveWays.push("Create or Design Badges");
			if (req.body.issueBadge) fiveWays.push("Issue Badges");
			if (req.body.displayBadge) fiveWays.push("Display Badges");
			if (req.body.researchBadge) fiveWays.push("Research Badges");
			if (req.body.joinBadge) fiveWays.push("Join the Badging Conversation");

			var share = [];
			if (req.body.shareCaseStyudy) share.push("Share case study");
			if (req.body.shareOB) share.push("Share OB with your network");

			doc.fiveWays = fiveWays.join(", ");
			doc.idea = (req.body.idea ? req.body.idea : "");
			doc.numberOfPeople = (req.body.numberOfPeople ? req.body.numberOfPeople : "");
			doc.location = (req.body.address ? req.body.address : "");
			doc.lat = (req.body.lat ? req.body.lat : "");
			doc.lon = (req.body.lon ? req.body.lon : "");
			doc.email = (req.body.email ? req.body.email : "");
			doc.name = (req.body.name ? req.body.name : "");
			doc.twitterHandle = (req.body.twitterHandle ? req.body.twitterHandle : "");
			doc.organisation = (req.body.organisation ? req.body.organisation : "");
			doc.share = share.join(", ");
			doc.subscribe = (!req.body.subscribe ? true : false);
			doc.save();
			res.redirect('/admin');
		});
	}
});
app.post('/deletePledge', csrfProtection, function(req, res) {
	if (req.user) {

		var pledge = Pledge.findOne({ uid: req.body.id}, function (err, doc){

			if (err) {
				console.log(err);
				res.send('There was an error deleting the pledge');
				return;
			}

			doc.remove();

			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({ status: "ok" }));
		});
	}
});
app.get('/share', function(req, res) {
	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	res.render('core/share.html', {
		pledge : qs.pledge
	});
});
app.get('/update', csrfProtection, function(req, res) {
	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	if (req.user) {
		var pledge = Pledge.findOne({ uid: qs.pledge}, function (err, doc){
			res.render('core/update.html', {
				user: req.user,
				pledge : doc,
				csrfToken: req.csrfToken()
			});
		});
	} else {
		res.send('This page does not exist', 404);
	}
});
app.get('/pledges', function(req, res) {
	if (req.user) {
		exclusions = {_id: 0, subscribe: 0, __v: 0};
	} else {
		exclusions = {_id: 0, subscribe: 0, email: 0, __v: 0};
	}

	db.Pledge.find({},exclusions).sort({created_at: 'descending'}).exec(function(e,data){
		res.setHeader('Content-Type', 'application/json');
		return res.send(JSON.stringify(data));
	});
});
app.get('/admin', csrfProtection, function(req, res) {
	res.render('core/admin.html', {
		user: req.user,
		csrfToken: req.csrfToken()
	});
});
app.post('/login', csrfProtection, passport.authenticate('login', {
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
	db.Pledge.find({},{_id: 0, subscribe: 0, __v: 0},function(e,data){

		var csvData = [];

		var headers = {
			fiveWays: '5 ways to pledge to become a Badge partner',
			idea: 'Tell us about your badging ideas',
			numberOfPeople: 'How many people will your badging efforts impact?',
			location: 'Location',
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
			csvData.push({
				fiveWays: data[i].fiveWays,
				idea: data[i].idea,
				numberOfPeople: data[i].numberOfPeople,
				location: data[i].location,
				email: data[i].email,
				name: data[i].name,
				twitterHandle: data[i].twitterHandle,
				organisation: data[i].organisation,
				share: data[i].share,
				created_at: date
			});
		};

		csvData.unshift(headers);

		res.attachment('pledges.csv');
		res.setHeader('Content-Type', 'text/csv');
		res.end(csv().from(csvData).to(res));
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
	var notificationAddresses = (process.env.PLEDGE_NOTIFICATION_ADDRESSES !== undefined) ? process.env.PLEDGE_NOTIFICATION_ADDRESSES : 'keith@bluemantis.com';
	app.mailer.send('core/email.html', {
		to: notificationAddresses, // REQUIRED. This can be a comma delimited string just like a normal email to field.
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
