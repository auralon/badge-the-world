# Badge the World

![screenshot](http://i.imgur.com/lHl8C0o.png)

### Setup Guide

###### 1. GET THE CODE

    git clone https://github.com/auralon/badge-the-world.git


###### 2. CHANGE WORKING DIRECTORY

    cd badge-the-world


###### 3. INSTALL DEPENDENCIES

    npm install


###### 4. CONFIGURE ENVIRONMENT

Copy `.env.example` to `.env` and adjust the variables accordingly.

| ENV VAR                        | ACTION                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| PORT                           | This can most likely remain unchanged, unless another service is using port 3000 (eg: ntop) |
| SESSION_SECRET                 | Change this to something unique and strong                                                  |
| DATABASE_URL                   | Change this to your postgres connection url                                                 |
| RECAPTCHA_SITE_KEY             | Change this to the key provided to you by Google                                            |
| RECAPTCHA_SECRET_KEY           | Change this to the key provided to you by Google                                            |
| SMTP_USER                      | Change this to your SMTP mail username                                                      |
| SMTP_PASSWD                    | Change this to your SMTP mail password                                                      |
| CONTACT_NOTIFICATION_ADDRESSES | Change this to the relevant email address(es) (comma-separated) for this notification       |
| PLEDGE_NOTIFICATION_ADDRESSES  | Change this to the relevant email address(es) (comma-separated) for this notification       |


###### 5. CONFIGURE POSTGRES DATABASE

You will also need to setup your tables, so run the following postgres statements to create the required tables:

    CREATE TABLE pledges (
    	"id"             serial,
    	"fiveWays"       text,
    	"idea"           text,
    	"topic"          text,
    	"numberOfPeople" text,
    	"location"       text,
    	"country"        text,
        "continent"      varchar(30),
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


###### 6. RUN THE SERVER

    node bin/www


---

### Additional Notes

If you've imported pledges into a previously empty database, be sure to update the serial sequence, otherwise you will get new pledges with conflicting ids.  To do this, run the following statement:

    SELECT pg_catalog.setval(pg_get_serial_sequence('pledges', 'id'), (SELECT MAX(id) FROM pledges)+1);
