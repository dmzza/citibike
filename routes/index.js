
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
	  var stations = data["results"]
	  	, timestamp = data["lastUpdate"]
	  	, allStations = new Array()
	  	, output = new Array();

		mongo.Db.connect(mongoUri, function (err, db) {
			try {
			if (err) throw err;

			var stationCollection = db.collection('stations')
				, updateCollection = db.collection('updates');

			for(var i = 0; i<stations.length; i++) {
				var station = stations[i];
				station["lastUpdate"] = timestamp;
				allStations[station["id"]] = station;

				stationCollection.findOne({"id": station["id"]}, function(err, stationRecord) {
					try {
					if (err) throw err;
					if(stationRecord === null) throw "missing station";


					var thisStation = allStations[stationRecord["id"]];

					stationRecord["availableBikes"] = thisStation["availableBikes"];
					stationRecord["availableDocks"] = thisStation["availableDocks"];
					stationRecord["status"] = thisStation["status"];
					output.push(stationRecord);

					updateCollection.findOne({"id": stationRecord["id"], "lastUpdate": stationRecord["lastUpdate"]}, function(err, lastUpdate) {
						if (err) throw err;

						if(lastUpdate == null || lastUpdate["availableBikes"] != stationRecord["availableBikes"]) {
							updateCollection.insert(allStations[stationRecord["id"]], {safe: true}, function(err,response) {
								if (err) throw err;
							});
							stationCollection.update({"id": stationRecord["id"]}, {$set: {"lastUpdate": timestamp}});
						}
					});
					} catch(err) {
						console.log(err);
					}
				});
			}
			setTimeout(function() {
				res.render('index', { title: 'CitiBike', stations: output });
			}, 2000);
			} catch(err) {
				console.log(err);
				res.send(500);
			}
		});


	});

};