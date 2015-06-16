var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Create a sequence
function sequenceGenerator(name){
    var SequenceSchema, Sequence;

    SequenceSchema = new mongoose.Schema({
    nextSeqNumber: { type: Number, default: 500 }
    });

    Sequence = mongoose.model(name + 'Seq', SequenceSchema);

    return {
    next: function(callback){
        Sequence.find(function(err, data){
        if(err){ throw(err); }

        if(data.length < 1){
            // create if doesn't exist create and return first
            Sequence.create({}, function(err, seq){
            if(err) { throw(err); }
            callback(seq.nextSeqNumber);
            });
        } else {
            // update sequence and return next
            Sequence.findByIdAndUpdate(data[0]._id, { $inc: { nextSeqNumber: 1 } }, function(err, seq){
            if(err) { throw(err); }
            callback(seq.nextSeqNumber);
            });
        }
        });
    }
    };
}

var sequence = sequenceGenerator('pledge');

var Pledge = new Schema({
    uid             : Number,
    fiveWays        : String,
    idea            : String,
    topic           : String,
    numberOfPeople  : String,
    location        : String,
    country         : String,
    lat             : String,
    lon             : String,
    email           : String,
    name            : String,
    twitterHandle   : String,
    organisation    : String,
    share           : String,
    subscribe       : String,
    created_at      : Date
});

Pledge.pre('save', function(next){
    var doc = this;
    // get the next sequence
    sequence.next(function(nextSeq){
    doc.uid = nextSeq;
    next();
    });
});

module.exports = mongoose.model('Pledge', Pledge);
