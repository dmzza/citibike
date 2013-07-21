
/*
 * GET home page.
 */

var Citibike = require('citibike')
	, citibike = new Citibike
	, geolocation = require('geolocation')
	, stations = new Array()
	, lat = 40.74144387
	, lon = -73.97536082;



exports.index = function(req, res){
	citibike.getStations(null, function(data) {
	  stations = data["results"];

	  res.render('index', { title: 'CitiBike', stations: stations });
	});

};