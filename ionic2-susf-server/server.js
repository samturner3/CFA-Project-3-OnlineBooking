// Set up
var express  = require('express');
var app      = express();
var mongoose = require('mongoose');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');

// Configuration
mongoose.connect('mongodb://localhost/susf');

app.use(bodyParser.urlencoded({ extended: false })); // Parses urlencoded bodies
app.use(bodyParser.json()); // Send JSON responses
app.use(logger('dev')); // Log requests to API using morgan
app.use(cors());

// Models
var Court = mongoose.model('Court', {
    court_number: Number,
    type: String,
    location: String,
    occupancy: Number,
    cost_per_hour_offpeak: Number,
    cost_per_hour_peak: Number,
    cost_per_extra_person_member: Number,
    cost_per_extra_person_guest: Number,
    // booking: [
    //           {
    //             reserved : [
    //                             {
    //                                 from: String,
    //                                 to: String
    //                             }
    //                         ],
    //               client : [
    //                             {
    //                                 f_name: String,
    //                                 l_name: String,
    //                                 phone: String,
    //                                 memberStatus: String
    //                             }
    //                           ],
    //               payment : [
    //                             {
    //                                 amount: Number
    //                             }
    //                           ]
    //           }
    //         ]
    reserved : [
                  {
                      from: String,
                      to: String
                  }
              ],
    client : [
                {
                    f_name: String,
                    l_name: String,
                    phone: String,
                    memberStatus: String
                }
              ],
    payment : [
               {
                   amount: Number
               }
             ]
});

/*
 * Generate some test data, if no records exist already
 * MAKE SURE TO REMOVE THIS IN PROD ENVIRONMENT
*/

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Court.remove({}, function(res){ //Remove all rooms of test data on db restart
    console.log("removed records");
});

Court.count({}, function(err, count){
    console.log("Courts: " + count);

    if(count === 0){

        var recordsToGenerate = 10;

        var courtTypes = [
            'squash',
            'tennis',
            'badminton'
        ];

        var courtLocations = [
            'Sports and Aquatic Centre',
            'The Arena',
            'Robyn Webster Sports Centre'
        ];

        // For testing purposes, all courts will be booked out from:
        //  2017-06-08T16:00:00 - 2017-06-08T17:00:00

        for(var i = 0; i < recordsToGenerate; i++){
            var newCourt = new Court({
                court_number: i,
                type: courtTypes[getRandomInt(0,2)],
                location: courtLocations[getRandomInt(0,2)],
                occupancy: getRandomInt(2, 4),
                cost_per_hour_offpeak: getRandomInt(20, 20),
                cost_per_hour_peak: getRandomInt(30, 35),
                cost_per_extra_person_member: getRandomInt(3, 3),
                cost_per_extra_person_guest: getRandomInt(4, 4),
                // reserved : [
                //               {
                //                   from: '2017-06-08T16:00:00',
                //                   to: '2017-06-08T17:00:00'
                //               }
                //           ],
                // client : [
                //             {
                //                 f_name: 'Sam',
                //                 l_name: 'Turner',
                //                 phone: '0404040404',
                //                 memberStatus: 'yes'
                //             }
                //           ],
                // payment : [
                //            {
                //                amount: '35'
                //            }
                //          ]
            });

            newCourt.save(function(err, doc){
                console.log("Created test document: " + doc._id);
            });
        }

    }
});

// Routes

    app.post('/api/courts', function(req, res) {
          console.log(req.body.from);
          console.log(req.body.to);
        Court.find({
            type: req.body.courtType,
            location: req.body.location,
            // booking: [
            //     {
            //       reserved:
            //       [
            //         {from: req.body.from, to: req.body.to}
            //       ]
            //     }
            // ]
            reserved: {

                //Check if any of the dates the court has been reserved for overlap with the requsted date time.
                $not: {
                    $elemMatch: {from: {$lt: req.body.to}, to: {$gt: req.body.from}}
                }

            }
        }, function(err, courts){
            if(err){
                res.send(err);
            } else {
                res.json(courts);
            }
        });

    });

    // app.post('/api/courts/confirmBooking', function(req, res) {
    //
    //     Court.find({
    //         type: req.body.courtType,
    //         location: req.body.location,
    //         reserved: {
    //
    //             //Check if any of the dates / times the court has been reserved for overlap with the requsted date time.
    //             $not: {
    //                 $elemMatch: {from: {$lt: req.body.to}, to: {$gt: req.body.from}}
    //             }
    //
    //         }
    //     }, function(err, courts){
    //         if(err){
    //             res.send(err);
    //         } else {
    //             res.json(courts);
    //         }
    //     });
    //
    // });

    app.post('/api/courts/reserve', function(req, res) {

        console.log(req.body);

        Court.findByIdAndUpdate(
          req.body._id,
          {
            $push: {
                    "reserved": {from: req.body.from, to: req.body.to},
                    "client": {f_name: req.body.f_name, l_name: req.body.l_name, phone: req.body.phone, memberStatus: req.body.memberStatus},
                    "payment": {amount: req.body.total}
            }
        }, {
            safe: true,
            new: true
        }, function(err, court){
            if(err){
                res.send(err);
            } else {
                res.json(court);
            }
        });

    });

// listen
app.listen(8080);
console.log("App listening on port 8080");
