
/*
 * GET stations listing.
 */

var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI ||
		process.env.MONGOHQ_URL ||
		'mongodb://localhost/citibike';

exports.list = function(req, res){
	var longitude = parseFloat(req.query.lon)
		, latitude = parseFloat(req.query.lat);

	mongo.Db.connect(mongoUri, function (err, db) {
		if (err) throw err;

		var stationCollection = db.collection('stations')
			, updateCollection = db.collection('updates');

		stationCollection.find({
			loc: {
				'$near': {
					'$geometry': {
						type: "Point",
						coordinates: [ longitude, latitude ]
					}, '$maxDistance': 500 }
				}
			}
		).toArray(function(err, nearbyStations) {
			res.json(nearbyStations);
		})

	});
};