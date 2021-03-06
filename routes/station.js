
/*
 * GET stations listing.
 */

var Citibike = require('citibike')
	, citibike = new Citibike
	, QMongoDB = require('q-mongodb')
	, mongo = require('mongodb');

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

	QMongoDB.db(mongoUri).then(function (db) {
		return [db.collection('stations'), db.collection('updates')];
	})
	.spread(function(stationCollection, updateCollection) {
			
		var stationCursor = stationCollection.find({
			loc: {
				$nearSphere: {
					$geometry: {
						type: "Point",
						coordinates: [ longitude, latitude ]
					},
					$maxDistance: 2000
				}
			}
		});

		return stationCursor.toArray();
	})
	.then(function(stations)) {
		stations.map(function(station) {
			
		})
	}
			
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

					var updateCursor = updateCollection.find({id: station["id"]}).sort({'lastUpdate': -1}).limit(1);
					updateCursor.nextObject(function(err, latestUpdate) {
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

						if(resultsCount === stationCount - missingUpdates || resultsCount === stationLimit - missingUpdates)
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

exports.sync = function(req, res){
	citibike.getStations(null, function(data) {
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
	        station["loc"] = {
	        	type: "Point",
	        	coordinates: new Array()
	        };
	        station.loc.coordinates[0] = station.longitude;
			station.loc.coordinates[1] = station.latitude;

	        delete station.status;
	        delete station.longitude;
	        delete station.latitude;
	        delete station.stationAddress;
	        delete station.availableBikes;
	        delete station.availableDocks;
	        delete station.nearbyStations;

	        stations[i] = station;

	        stationCollection.findOne({"id": station.id}, function(err, stationRecord) {
	          try {
		          if (err) throw err;
		          if(stationRecord === null) {
		          	console.log(station.id + " not found, inserting");
		          	// New Station Found
		          	stationCollection.insert(station, {safe: true}, function(err,response) {
		          		if (err) throw err;
		          	});
		          } else {
		          	console.log(station.id + " found, updating");
		          	// Station Exists, Update it
		          	stationCollection.update({"id": station.id}, {$set: station});
		          }
	          } catch(err) {
		          console.log(err);
		          res.send(500);
	          }
	        });

	        // TODO: Any stations with a lastUpdate != timestamp are now old, and should be deleted, with all of their updates.

	      }
	      res.send(stations);

	      

	      } catch(err) {
	      console.log(err);
	      res.send(500);
	      }
	    });
	});
};