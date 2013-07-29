
/*
 * GET stations listing.
 */

var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI ||
		process.env.MONGOHQ_URL ||
		'mongodb://localhost/citibike';

exports.list = function(req, res){
	var longitude = parseFloat(req.query.lon)
		, latitude = parseFloat(req.query.lat)
		, output = new Array()
		, missingUpdates = 0
		, nearbyStations = new Array()
		, timeSpan = new Date().getTime() / 1000 - (4 * 60 * 60); /* hours * minutes * seconds */

	mongo.Db.connect(mongoUri, function (err, db) {
		try {
		if (err) throw err;

		var stationCollection = db.collection('stations')
			, updateCollection = db.collection('updates');

		var stationCursor = stationCollection.find({
			loc: {
				'$near': {
					'$geometry': {
						type: "Point",
						coordinates: [ longitude, latitude ]
					}, '$maxDistance': 500 }
				}
			}
		);
		var stationCount = 0;
		stationCursor.count(function(err, count) {
			stationCount = count;
		});

		stationCursor.each(function(err, station) {
			// If the item is null then the cursor is exhausted/empty and closed
			if(station == null) {
				//db.close();
				// res.json(output);
			} else {
				nearbyStations[station["id"]] = station;
				updateCollection.aggregate( [ { '$match': { id: station["id"], lastUpdate: {$gt: timeSpan} } }, { '$group': { '_id': '$id', minBikes: { '$min': "$availableBikes"} } } ], function(err, minResult) {
					try {
					if (err) throw err;
					if(typeof minResult[0] == "undefined") {
						missingUpdates++;
						throw "missing recent updates";
					}

					minBikes = minResult[0].minBikes;
					nearbyStations[minResult[0]._id].minBikes = minBikes;

					updateCollection.findOne({$query: {id: station["id"]}, $orderby: {'lastUpdate': -1}}, function(err, latestUpdate) {
						if(err) throw err;

						thisId = latestUpdate["id"]
						latestStatus = latestUpdate["status"]
						latestBikes = latestUpdate["availableBikes"]
						latestDocks = latestUpdate["availableDocks"]
						totalDocks = latestBikes + latestDocks;
						nearbyStations[thisId].availableBikes = latestBikes;

						if(nearbyStations[thisId].minBikes < latestBikes || (latestBikes / totalDocks) > 0.15) {
							nearbyStations[thisId].bikeStatus = "OK"
						} else {
							nearbyStations[thisId].bikeStatus = "NO"
						}
						if(latestDocks > 1) {
							nearbyStations[thisId].dockStatus = "OK"
						} else {
							nearbyStations[thisId].dockStatus = "NO"
						}
						if(latestStatus != "Active") {
							nearbyStations[thisId].bikeStatus = "NO"
							nearbyStations[thisId].dockStatus = "NO"
						}

						nearbyStations[thisId].longitude = nearbyStations[thisId].loc.coordinates[0];
						nearbyStations[thisId].latitude = nearbyStations[thisId].loc.coordinates[1];
						delete nearbyStations[thisId].loc;

						output.push(nearbyStations[thisId]);

						//console.log("id: " + latestUpdate["id"] + " minBikes: " + nearbyStations[thisId].minBikes + " latestBikes: " + latestBikes + " counts: " + stationCount + " === " + output.length);

						if(output.length === stationCount - missingUpdates)
							res.json(output);
					});
					} catch(err) {
						console.log(err);
					}
				});

			}
		});
		} catch(err) {
			console.log(err);
			res.send(500);
		}
	});
};