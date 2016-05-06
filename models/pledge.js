var db = require('../db.js');

var Pledge = db.sequelize.define('pledge', {
    "id": {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    "fiveWays"        : db.Sequelize.TEXT,
    "idea"            : db.Sequelize.TEXT,
    "topic"           : db.Sequelize.TEXT,
    "numberOfPeople"  : db.Sequelize.TEXT,
    "location"        : db.Sequelize.TEXT,
    "country"         : db.Sequelize.TEXT,
    "continent"       : db.Sequelize.TEXT,
    "lat"             : db.Sequelize.TEXT,
    "lon"             : db.Sequelize.TEXT,
    "email"           : db.Sequelize.TEXT,
    "name"            : db.Sequelize.TEXT,
    "twitterHandle"   : db.Sequelize.TEXT,
    "organisation"    : db.Sequelize.TEXT,
    "subscribe"       : db.Sequelize.TEXT,
});

module.exports = Pledge;
