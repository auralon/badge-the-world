var db = require('../db.js');
passportLocalSequelize = require('passport-local-sequelize');

var User = db.sequelize.define('user', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: db.Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    hash: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    salt: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    activationKey: {
        type: db.Sequelize.STRING,
        allowNull: true
    },
    resetPasswordKey: {
        type: db.Sequelize.STRING,
        allowNull: true
    }
});

passportLocalSequelize.attachToUser(User, {});

module.exports = User;
