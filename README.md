# Badge the World

![screenshot](http://i.imgur.com/lHl8C0o.png)

### Setup Guide

###### Get the code

`git clone https://github.com/auralon/badge-the-world.git`


###### Change working directory

`cd badge-the-world`


###### Install dependencies

`npm install`


###### Configure session secret

Open `app.js` and change '**keyboard cat strikes again**' to something unique and strong


###### Configure postgres database

Open `db.js` and change the postgres connection url, which is currently set at '**postgres://postgres:password@localhost:5432/postgres**'


You will also need to setup your tables, so run the following postgres statements:

    CREATE TABLE pledges (
    	"id"            serial,
    	"fiveWays"       text,
    	"idea"           text,
    	"topic"          text,
    	"numberOfPeople" text,
    	"location"       text,
    	"country"        text,
    	"lat"            varchar(20),
    	"lon"            varchar(20),
    	"email"          varchar(255),
    	"name"           text,
    	"twitterHandle"  varchar(30),
    	"organisation"   text,
    	"subscribe"      boolean,
    	"createdAt"      timestamp,
    	"updatedAt"      timestamp
    );


    CREATE TABLE users (
    	"id"               serial,
    	"username"         text,
    	"hash"             text,
    	"salt"             text,
    	"activationKey"    text,
    	"resetPasswordKey" text,
    	"createdAt"        timestamp,
    	"updatedAt"        timestamp
    );


###### Configure recaptcha and mailer

Open `routes/index.js` and replace '**your_recaptcha_site_key_here**' and '**your_recaptcha_secret_key_here**' with your actual keys provided by Google.


Then, alter your smtp mail credentials (replace "**exampled@gmail.com**" and "**password**" in the section of code that is shown below):

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


Finally, look for the 2 lines that contain "process.env.CONTACT_NOTIFICATION_ADDRESSES" and "process.env.PLEDGE_NOTIFICATION_ADDRESSES" and replace the string "example@gmail.com" with the relevant email addresses for that notification.


###### Run the server

`node bin/www`


