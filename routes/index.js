
/*
 * GET home page.
 */

var Citibike = require('citibike')
	, citibike = new Citibike
	, geolocation = require('geolocation')
	, mongo = require('mongodb')
	, stations = new Array()
	, lat = 40.74144387
	, lon = -73.97536082;

var mongoUri = process.env.MONGOLAB_URI ||
		process.env.MONGOHQ_URL ||
		'mongodb://localhost/citibike';

exports.index = function(req, res){
	citibike.getStations({updateOnly: "true"}, function(data) {
	  stations = data["results"];

		mongo.Db.connect(mongoUri, function (err, db) {
			if (err) throw err;
			console.log("Connected to Database");

			//simple json record
			var document = {name:"David", title:"About MongoDB"};
			db.collection('stations', function(er, collection) {
				for(i=0; i<stations.length; i++) {
					station = stations[i];
					// delete station["nearbyStations"];
					// delete station[""]
					collection.insert(station, {safe: true}, function(error,response) {

					});
				}
			});
		});

		res.render('index', { title: 'CitiBike', stations: stations });
	});

};