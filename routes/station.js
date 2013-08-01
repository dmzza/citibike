
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
		, resultsCount = 0
		, nearbyStations = new Array()
		, timeSpan = new Date().getTime() / 1000 - (4 * 60 * 60); /* hours * minutes * seconds */

	mongo.Db.connect(mongoUri, function (err, db) {
		try {
		if (err) throw err;

		var stationCollection = db.collection('stations')
			, updateCollection = db.collection('updates');

		var stationCursor = stationCollection.find({
			loc: {
				'$nearSphere': {
					'$geometry': {
						type: "Point",
						coordinates: [ longitude, latitude ]
					}}
				}
			}, { 'limit': 5}
		);
		var stationCount = 0;
		stationCursor.count(function(err, count) {
			stationCount = count;

			if(count === 0) {
				res.send(404);
			}
		});

		var orderCount = 0;
		stationCursor.each(function(err, station) {
			// If the item is null then the cursor is exhausted/empty and closed
			if(station == null) {
				//db.close();
				// res.json(output);
			} else {
				nearbyStations[station["id"]] = orderCount;
				output[orderCount] = station;
				orderCount++;
				updateCollection.aggregate( [ { '$match': { id: station["id"], lastUpdate: {$gt: timeSpan} } }, { '$group': { '_id': '$id', minBikes: { '$min': "$availableBikes"}, minDocks: { '$min': "$availableDocks"} } } ], function(err, minResult) {
					try {
					if (err) throw err;
					if(typeof minResult[0] == "undefined") {
						missingUpdates++;
						throw "missing recent updates";
					}

					minBikes = minResult[0].minBikes;
					minDocks = minResult[0].minDocks;
					outputId = nearbyStations[minResult[0]._id]
					output[outputId].minBikes = minBikes;
					output[outputId].minDocks = minDocks;

					updateCollection.findOne({$query: {id: station["id"]}, $orderby: {'lastUpdate': -1}}, function(err, latestUpdate) {
						if(err) throw err;

						thisOutputId = nearbyStations[latestUpdate["id"]]
						latestStatus = latestUpdate["status"]
						latestBikes = latestUpdate["availableBikes"]
						latestDocks = latestUpdate["availableDocks"]
						totalDocks = latestBikes + latestDocks;
						output[thisOutputId].availableBikes = latestBikes;
						output[thisOutputId].availableDocks = latestDocks;

						if(output[thisOutputId].minBikes < latestBikes || (latestBikes / totalDocks) > 0.15) {
							output[thisOutputId].bikeStatus = "OK"
						} else {
							output[thisOutputId].bikeStatus = "NO"
						}
						if(output[thisOutputId].minDocks < latestDocks || (latestDocks / totalDocks) > 0.15) {
							output[thisOutputId].dockStatus = "OK"
						} else {
							output[thisOutputId].dockStatus = "NO"
						}
						if(latestStatus != "Active") {
							output[thisOutputId].bikeStatus = "NO"
							output[thisOutputId].dockStatus = "NO"
						}

						output[thisOutputId].longitude = output[thisOutputId].loc.coordinates[0];
						output[thisOutputId].latitude = output[thisOutputId].loc.coordinates[1];
						delete output[thisOutputId].loc;

						resultsCount++;

						//console.log("id: " + latestUpdate["id"] + " minBikes: " + nearbyStations[thisId].minBikes + " latestBikes: " + latestBikes + " counts: " + stationCount + " === " + output.length);

						if(resultsCount === stationCount - missingUpdates || resultsCount === 5 - missingUpdates)
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