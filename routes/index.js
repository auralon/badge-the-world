var csrf = require('csurf');
var csv = require('express-csv');
var cookieParser = require('cookie-parser');
var responsive = require('express-responsive');
var bodyParser = require('body-parser');
var express = require('express');
var querystring = require('querystring');
var mailer = require('express-mailer');
var passport = require('passport');
var Pledge = require('../models/pledge');
var Account = require('../models/account');
var router = express.Router();

/*
 SETUP ROUTE MIDDLEWARES
 */
var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });


var app = express();

/*
 SET VIEW ENGINE
 */
app.set('view engine', 'jade');

/*
 INITIALISE RESPONSIVE MODULE
 */
router.use(responsive.deviceCapture());

/*
 CONFIGURE MAILER
 */
mailer.extend(app, {
	from: 'no-reply@badgetheworld.org',
	host: 'smtp.gmail.com', // hostname
	secureConnection: true, // use SSL
	port: 465, // port for secure SMTP
	transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
	auth: {
		user: ((process.env.SMTP_USER !== undefined) ? process.env.SMTP_USER : 'example@gmail.com'),
		pass: ((process.env.SMTP_PASSWD !== undefined) ? process.env.SMTP_PASSWD : 'password')
	}
});

var sendPledgeEmail = function(res, pledge, callback) {
	var notificationAddresses = (process.env.PLEDGE_NOTIFICATION_ADDRESSES !== undefined) ? process.env.PLEDGE_NOTIFICATION_ADDRESSES : 'example@gmail.com';
	app.mailer.send('emails/pledge', {
		to: notificationAddresses, // REQUIRED. This can be a comma delimited string just like a normal email to field.
		subject: 'New Pledge!', // REQUIRED.
		pledge: pledge,
	}, function (err) {
		if (callback && typeof(callback) == "function") {
			callback(err, res);
		}
	});
}

var sendContactEmail = function(res, post, callback) {
	var notificationAddresses = (process.env.CONTACT_NOTIFICATION_ADDRESSES !== undefined) ? process.env.CONTACT_NOTIFICATION_ADDRESSES : 'example@gmail.com';
	app.mailer.send('emails/contact', {
		to: notificationAddresses, // This can be a comma delimited string just like a normal email to field.
		subject: 'New Badge the World contact submission',
		post: post,
	}, function (err) {
		if (callback && typeof(callback) == "function") {
			callback(err, res);
		}
	});
}

app.use(cookieParser());


/*
 HOME PAGE
 */
router.get('/', csrfProtection, function (req, res) {

	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	var showModal = (typeof qs.pledge === "undefined") ? true : false;

	res.render('index', 
		{
			title: "Badge the World",
			pledge : qs.pledge,
			showModal: showModal,
			user : req.user,
			csrfToken: req.csrfToken(),
			device: req.device
		}
	);
});

/*
 RETRIEVE PLEDGES (AJAX)
 */
router.get('/getPledges', function(req, res) {
	if (req.user) {
		exclusions = {_id: 0, subscribe: 0, __v: 0};
	} else {
		exclusions = {_id: 0, subscribe: 0, email: 0, __v: 0};
	}

	Pledge.find({},exclusions).sort({created_at: 'descending'}).exec(function(err,pledges){
		if (err) return console.error(err);
		res.setHeader('Content-Type', 'application/json');
		return res.send(JSON.stringify(pledges));
	});
});

/*
 CONTACT FORM SUBMISSION
 */
router.post('/contact', parseForm, csrfProtection, function(req, res) {
	sendContactEmail(res, req.body, function(err, res) {
		res.setHeader('Content-Type', 'application/json');
		if (err) {
			return res.send({'status':'error'});
		}
		return res.send({'status':'success'});
	});
});

/*
 PLEDGE SUBMISSION
 */
router.post('/createPledge', csrfProtection, function(req, res) {

	var fiveWays = [];
	if (req.body.createBadge) fiveWays.push("Create or Design Badges");
	if (req.body.issueBadge) fiveWays.push("Issue Badges");
	if (req.body.displayBadge) fiveWays.push("Display Badges");
	if (req.body.researchBadge) fiveWays.push("Research Badges");
	if (req.body.joinBadge) fiveWays.push("Join the Badging Conversation");

	var share = [];
	if (req.body.shareCaseStyudy) share.push("Share case study");
	if (req.body.shareOB) share.push("Share OB with your network");

	var pledge = new Pledge({
		fiveWays: fiveWays.join(", "),
		idea : (req.body.idea ? req.body.idea : ""),
		topic : req.body.topic,
		numberOfPeople : (req.body.numberOfPeople ? req.body.numberOfPeople : ""),
		location : (req.body.address ? req.body.address : ""),
		country : req.body.country,
		lat: (req.body.lat ? req.body.lat : ""),
		lon: (req.body.lon ? req.body.lon : ""),
		email : (req.body.email ? req.body.email : ""),
		name : (req.body.name ? req.body.name : ""),
		twitterHandle : (req.body.twitterHandle ? req.body.twitterHandle : ""),
		organisation : (req.body.organisation ? req.body.organisation : ""),
		share : share.join(", "),
		subscribe : (!req.body.subscribe ? "Y" : "N"),
		created_at : Date.now()
	}).save( function( err, pledge, count ){
		if (err) {
			res.setHeader('Content-Type', 'application/json');
			return res.send({'status':'error'});
		} else {
			sendPledgeEmail(res, pledge, function(err, res) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					console.log(err);
				}
				return res.send({'status':'success', 'pledge': pledge});
			});
		}
	});

});

/*
 UPDATE PLEDGE PAGE
 */
router.get('/update', csrfProtection, function(req, res) {
	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	if (req.user) {
		var pledge = Pledge.findOne({ uid: qs.pledge}, function (err, doc){
			res.render('update', {
				user: req.user,
				pledge : doc,
				csrfToken: req.csrfToken()
			});
		});
	} else {
		res.send('This page does not exist', 404);
	}
});

/*
 UPDATE PLEDGE FORM SUBMISSION
 */
router.post('/updatePledge', csrfProtection, function(req, res) {
	if (req.user) {

		console.log(req.body)

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
			doc.topic = req.body.topic;
			doc.numberOfPeople = (req.body.numberOfPeople ? req.body.numberOfPeople : "");
			doc.location = (req.body.address ? req.body.address : "");
			doc.lat = (req.body.lat ? req.body.lat : "");
			doc.lon = (req.body.lon ? req.body.lon : "");
			doc.email = (req.body.email ? req.body.email : "");
			doc.name = (req.body.name ? req.body.name : "");
			doc.twitterHandle = (req.body.twitterHandle ? req.body.twitterHandle : "");
			doc.organisation = (req.body.organisation ? req.body.organisation : "");
			doc.share = share.join(", ");
			doc.subscribe = (!req.body.subscribe ? "Y" : "N");
			doc.save();
			res.redirect('/admin');
		});
	}
});

/*
 DELETE PLEDGE
 */
router.post('/deletePledge', csrfProtection, function(req, res) {
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

/*
 REGISTER USER PAGE
 */
// router.get('/register', function(req, res) {
// 	res.render('register', { });
// });

// /*
//  REGISTER USER SUBMISSION
//  */
// router.post('/register', function(req, res) {
// 	Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
// 		if (err) {
// 			return res.render('register', { account : account });
// 		}

// 		passport.authenticate('local')(req, res, function () {
// 			res.redirect('/');
// 		});
// 	});
// });

/*
 LOGIN PAGE
 */
router.get('/admin', csrfProtection, function(req, res) {
	res.render('admin', { title: "Badge the World - Admin Panel", user : req.user, csrfToken: req.csrfToken() });
});

/*
 LOGIN SUBMISSION
 */
router.post('/admin', parseForm, csrfProtection, passport.authenticate('local'), function(req, res) {
	res.redirect('/admin');
});

/*
 LOGOUT
 */
router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

/*
 DOWNLOAD PLEDGES AS CSV (ADMIN ONLY)
 */
router.get('/download', function(req, res) {
	Pledge.find({},{_id: 0, subscribe: 0, __v: 0},function(error,data){

		if (error) return next(err);

		var csvData = [];

		var headers = {
			fiveWays: '5 ways to pledge to become a Badge partner',
			idea: 'Tell us about your badging ideas',
			topic: 'Topic',
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
				topic: data[i].topic,
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
		var d = new Date();
		res.attachment('pledges-' + d.toISOString().replace('T','_').replace(/\:/g,'').split('.')[0] + '.csv');
		res.csv(csvData);
	});
});

module.exports = router;
