var csrf = require('csurf'),
	csv = require('express-csv'),
	cookieParser = require('cookie-parser'),
	responsive = require('express-responsive'),
	bodyParser = require('body-parser'),
	express = require('express'),
	querystring = require('querystring'),
	mailer = require('express-mailer'),
	passport = require('passport'),
	passportLocalSequelize = require('passport-local-sequelize'),
	Pledge = require('../models/pledge'),
	User = require('../models/user'),
	router = express.Router(),
	recaptcha = require('express-recaptcha'),
	recaptchaSiteKey = ((process.env.RECAPTCHA_SITE_KEY !== undefined) ? process.env.RECAPTCHA_SITE_KEY : 'your_recaptcha_site_key_here'),
	recaptchaSecretKey = ((process.env.RECAPTCHA_SECRET_KEY !== undefined) ? process.env.RECAPTCHA_SECRET_KEY : 'your_recaptcha_secret_key_here');

/*
 INIT REPATCHA
 */
recaptcha.init(recaptchaSiteKey, recaptchaSecretKey, {
	callback: 'successfullySubmitted',
	fallback: true
});

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

var sendEmail = function(res, data, callback) {
	app.mailer.send(data.template, {
		to: data.notificationAddresses, // REQUIRED. This can be a comma delimited string just like a normal email to field.
		subject: data.subject, // REQUIRED.
		data: data,
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
router.get('/', [csrfProtection, recaptcha.middleware.render], function (req, res) {

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
			device: req.device,
			siteUrl: req.headers.host,
			captcha:req.recaptcha
		}
	);
});

/*
 RETRIEVE PLEDGES (AJAX)
 */
router.get('/getPledges', function(req, res) {

	var exclusions = ['subscribe'];

	if (!req.user) {
		exclusions.push('email');
	}

	Pledge.findAll({
		attributes: { exclude: exclusions },
		order: '"createdAt" DESC'
	}).then(function(pledges) {
		if (pledges !== undefined) {
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			return res.send(JSON.stringify(pledges));
		}
	});
});

/*
 CONTACT FORM SUBMISSION
 */
router.post('/contact', parseForm, csrfProtection, function(req, res) {

	var data = req.body;
	data.template = 'emails/contact';
	data.notificationAddresses = (process.env.CONTACT_NOTIFICATION_ADDRESSES !== undefined) ? process.env.CONTACT_NOTIFICATION_ADDRESSES : 'example@gmail.com';
	data.subject = 'New Badge the World contact submission';

	sendEmail(res, data, function(err, res) {
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		if (err) {
			console.log(err);
			return res.send({'status':'error'});
		}
		return res.send({'status':'success'});
	});
});

/*
 PLEDGE SUBMISSION
 */
router.post('/createPledge', [csrfProtection, recaptcha.middleware.verify], function(req, res) {

	if (!req.recaptcha.error){

	var fiveWays = [];
	if (req.body.createBadge) fiveWays.push("Create or Design Badges");
	if (req.body.issueBadge) fiveWays.push("Issue Badges");
	if (req.body.displayBadge) fiveWays.push("Display Badges");
	if (req.body.researchBadge) fiveWays.push("Research Badges");
	if (req.body.joinBadge) fiveWays.push("Join the Badging Conversation");

	Pledge.build({
		fiveWays: fiveWays.join(", "),
		idea : (req.body.idea ? req.body.idea : ""),
		topic : req.body.topic,
		numberOfPeople : (req.body.numberOfPeople ? req.body.numberOfPeople : ""),
		location : (req.body.address ? req.body.address : ""),
		country : req.body.country,
		continent: req.body.continent,
		lat: (req.body.lat ? req.body.lat : ""),
		lon: (req.body.lon ? req.body.lon : ""),
		email : (req.body.email ? req.body.email : ""),
		name : (req.body.name ? req.body.name : ""),
		twitterHandle : (req.body.twitterHandle ? req.body.twitterHandle : ""),
		organisation : (req.body.organisation ? req.body.organisation : ""),
		subscribe : !req.body.subscribe,
	})
	.save()
	.then(function(pledge) {
		pledge.template = 'emails/pledge';
		pledge.notificationAddresses = (process.env.PLEDGE_NOTIFICATION_ADDRESSES !== undefined) ? process.env.PLEDGE_NOTIFICATION_ADDRESSES : 'example@gmail.com';
		pledge.subject = 'New Pledge!';

		sendEmail(res, pledge, function(err, res) {
			res.setHeader('Content-Type', 'application/json');
			if (err) {
				console.log(err);
				return res.send({'status':'error'});
			}
			return res.send({'status':'success', 'pledge': pledge});
		});
	}).catch(function(err) {
		res.setHeader('Content-Type', 'application/json');
		console.log(err);
		return res.send({'status':'error'});
	});

}

});

/*
 UPDATE PLEDGE PAGE
 */
router.get('/update', csrfProtection, function(req, res) {
	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	Pledge.findById(qs.pledge)
	.then(function(pledge) {
		if ((pledge !== undefined) && req.user) {
			res.render('update', {
				user: req.user,
				pledge : pledge,
				csrfToken: req.csrfToken()
			});
		} else {
			res.send('This page does not exist', 404);
			return;
		}
	});

});

/*
 UPDATE PLEDGE FORM SUBMISSION
 */
router.post('/updatePledge', csrfProtection, function(req, res) {
	if (req.user) {

		Pledge.findById(req.body.id)
		.then(function(pledge) {
			if (pledge !== undefined) {

				var fiveWays = [];
				if (req.body.createBadge) fiveWays.push("Create or Design Badges");
				if (req.body.issueBadge) fiveWays.push("Issue Badges");
				if (req.body.displayBadge) fiveWays.push("Display Badges");
				if (req.body.researchBadge) fiveWays.push("Research Badges");
				if (req.body.joinBadge) fiveWays.push("Join the Badging Conversation");

				pledge.update({
					"fiveWays": fiveWays.join(", "),
					"idea": (req.body.idea ? req.body.idea : ""),
					"topic": req.body.topic,
					"numberOfPeople": (req.body.numberOfPeople ? req.body.numberOfPeople : ""),
					"location": (req.body.address ? req.body.address : ""),
					"lat": (req.body.lat ? req.body.lat : ""),
					"lon": (req.body.lon ? req.body.lon : ""),
					"email": (req.body.email ? req.body.email : ""),
					"name": (req.body.name ? req.body.name : ""),
					"twitterHandle": (req.body.twitterHandle ? req.body.twitterHandle : ""),
					"organisation": (req.body.organisation ? req.body.organisation : ""),
					"subscribe": !req.body.subscribe,
				}).then(function() {
					res.redirect('/admin');
				}).catch(function(err) {
					res.send('There was a problem updating the pledge');
				});
			} else {
				res.send('There was an error finding the pledge');
				return;
			}
		});
	}
});

/*
 DELETE PLEDGE
 */
router.post('/deletePledge', csrfProtection, function(req, res) {
	if (req.user) {
		Pledge.findById(req.body.id)
		.then(function(pledge) {
			if ((pledge !== undefined) && pledge.destroy()) {
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({ status: "ok" }));
			} else {
				res.send('There was an error deleting the pledge');
				return;
			}
		});
	}
});

/*
 REGISTER USER PAGE
 */
// router.get('/register', function(req, res) {
// 	res.render('register', { });
// });

/*
 REGISTER USER SUBMISSION
 */
// router.post('/register', function(req, res) {
// 	User.register(req.body.username, req.body.password, function(err) {
// 		if (err) {
// 			return res.render('register', { account : account });
// 		}
// 		passport.authenticate('local')(req, res, function () {
// 			res.redirect('/admin');
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

	Pledge.findAll({}).then(function(pledges) {
		if (pledges !== undefined) {

			var csvData = [];

			var headers = {
				fiveWays: '5 ways to pledge to become a Badge partner',
				idea: 'Tell us about your badging ideas',
				topic: 'Topic',
				numberOfPeople: 'How many people will your badging efforts impact?',
				location: 'Location',
				continent: 'Continent',
				email: 'Email Address',
				name: 'Name',
				twitterHandle: 'Twitter Username',
				organisation: 'Organisation',
				createdAt: "Date of pledge",
			}

			for (var i = pledges.length - 1; i >= 0; i--) {
				var date = new Date(pledges[i].createdAt);
				date = date.toISOString().substr(0, 19).replace('T', ' ');
				csvData.push({
					fiveWays: pledges[i].fiveWays,
					idea: pledges[i].idea,
					topic: pledges[i].topic,
					numberOfPeople: pledges[i].numberOfPeople,
					location: pledges[i].location,
					continent: pledges[i].continent,
					email: pledges[i].email,
					name: pledges[i].name,
					twitterHandle: pledges[i].twitterHandle,
					organisation: pledges[i].organisation,
					createdAt: date
				});
			};
			csvData.unshift(headers);
			var d = new Date();
			res.attachment('pledges-' + d.toISOString().replace('T','_').replace(/\:/g,'').split('.')[0] + '.csv');
			res.csv(csvData);

		} else {
			res.send('There was an error downloading the pledges');
			return;
		}
	});

});

module.exports = router;
