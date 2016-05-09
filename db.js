var pg = require('pg'),
	hstore = require('pg-hstore')(),
	Sequelize = require('sequelize'),
	rdb = (process.env.DATABASE_URL !== undefined) ? process.env.DATABASE_URL : 'postgres://postgres:password@localhost:5432/postgres',
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
