require('./db');

'use strict';

const config = require('./lib/config');
const express = require('express');
const http = require('http');
const querystring = require('querystring');
const flash = require('connect-flash');
const helpers = require('./helpers');
const middleware = require('./middleware');
const nunjucks = require('nunjucks');
const path = require('path');
const views = require('./views');

const mongo = require('mongodb');
const monk = require('monk');
const db = monk('mongodb://localhost/badge-the-world');
// const db = monk(process.env.MONGODB);

const app = express();
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname, 'templates')), {autoescape: true});
env.express(app);

// Bootstrap the app for reversible routing, and other niceties
require('../lib/router.js')(app);

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
app.use(express.bodyParser());
app.use(middleware.session());
app.use(middleware.csrf());
app.use(flash());

app.use(helpers.addCsrfToken);
app.use(helpers.addMessages);

app.use(staticRoot, express.static(staticDir));

app.get('/', function(req, res) {

	var str = req.url.split('?')[1];
	var qs = querystring.parse(str);

	res.render('core/home.html', {
		pledge : qs.pledge
	});

});
app.get('/pledge', function(req, res) {
	res.render('core/pledge.html', {
		_csrf : req.session._csrf
	});
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
			res.redirect('/share?pledge=' + pledge._id);
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

if (!module.parent) {
	var port = config('PORT', 3099);

	app.listen(port, function(err) {
		if (err) throw err;
		console.log("Listening on port " + port + ".");
	});
} else {
	module.exports = http.createServer(app);
}