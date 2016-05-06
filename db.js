var pg = require('pg'),
	hstore = require('pg-hstore')(),
	Sequelize = require('sequelize'),
	rdb = (process.env.DATABASE_URL !== undefined) ? process.env.DATABASE_URL : 'postgres://ocsarfjdptkzwi:Dtsh8MiBk8vRF0QRiJbSgZvv9u@ec2-54-217-245-173.eu-west-1.compute.amazonaws.com:5432/di979em6cd5uf',
	match = rdb.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
	sequelize = new Sequelize(match[5], match[1], match[2], {
	    dialect:  'postgres',
	    protocol: 'postgres',
	    port:     match[4],
	    host:     match[3],
	    logging: false,
	    dialectOptions: {
	        ssl: true
	    }
	});

module.exports = {
	'Sequelize': Sequelize,
	'sequelize': sequelize
};
