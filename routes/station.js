
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
		, timeSpan = new Date().getTime() - (2 * 60 * 60 * 1000); /* hours * minutes * seconds * milliseconds */

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
		).each(function(err, station) {
			// If the item is null then the cursor is exhausted/empty and closed
			if(station == null) {
				db.close();
				res.json(output);
			} else {
				updateCollection.find({id: station["id"], lastUpdated: {'$gt': timeSpan}}).sort({lastUpdated: 1}).each(function(err, update) {

				})
				output.push(station);
			}
		})

	});
};