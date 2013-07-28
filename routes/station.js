
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
		, nearbyStations = new Array()
		, timeSpan = new Date().getTime() / 1000 - (4 * 60 * 60); /* hours * minutes * seconds */

	mongo.Db.connect(mongoUri, function (err, db) {
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
					if(err) throw err;

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

						output.push(nearbyStations[thisId]);

						//console.log("id: " + latestUpdate["id"] + " minBikes: " + nearbyStations[thisId].minBikes + " latestBikes: " + latestBikes + " counts: " + stationCount + " === " + output.length);

						if(output.length === stationCount)
							res.json(output);
					});
				});

				updateCollection.find({id: station["id"], lastUpdated: {'$gt': timeSpan}}).sort({lastUpdate: 1}).each(function(err, update) {

				});

			}
		})

	});
};