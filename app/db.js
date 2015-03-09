var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Pledge = new Schema({
    fiveWays        : String,
    idea    		: String,
    numberOfPeople	: String,
    location		: String,
    postcode		: String,
    email			: String,
    name			: String,
    twitterHandle	: String,
    organisation	: String,
    share       	: String,
    subscribe		: Boolean,
    created_at 		: Date
});
mongoose.model( 'Pledge', Pledge );

var User = new Schema({
    username: String,
    password: String
});
mongoose.model( 'User', User );

// mongoose.connect( 'mongodb://localhost/badge-the-world' );
mongoose.connect(process.env.MONGODB);