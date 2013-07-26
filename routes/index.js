
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
	  timestamp = data["lastUpdate"];
	  allStations = new Array();

		mongo.Db.connect(mongoUri, function (err, db) {
			if (err) throw err;

			var stationCollection = db.collection('stations')
				, updateCollection = db.collection('updates');

			for(var i = 0; i<stations.length; i++) {
				var station = stations[i];
				station["lastUpdate"] = timestamp;
				allStations[station["id"]] = station;

				stationCollection.findOne({"id": station["id"]}, function(err, stationRecord) {
					if (err) throw err;

					var thisStation = allStations[stationRecord["id"]];
					console.log(thisStation);

					stationRecord["availableBikes"] = thisStation["availableBikes"];
					stationRecord["availableDocks"] = thisStation["availableDocks"];
					//stationRecord["status"] = station["status"];
					//allStations.push(stationRecord);

					updateCollection.findOne({"id": stationRecord["id"], "lastUpdate": stationRecord["lastUpdate"]}, function(err, lastUpdate) {
						if (err) throw err;

						//console.log(station);
						if(lastUpdate == null || lastUpdate["availableBikes"] != station["availableBikes"]) {
							updateCollection.insert(allStations[stationRecord["id"]], {safe: true}, function(err,response) {
								if (err) throw err;
								//console.log(station);
							});
							stationCollection.update({"id": stationRecord["id"]}, {$set: {"lastUpdate": timestamp}});
						}
					});
				});
				//if(allStations.length === stations.length) {
					res.render('index', { title: 'CitiBike', stations: allStations });
				//}
			}
		});


	});

};