
/*
 * GET home page.
 */

var Citibike = require('citibike')
	, citibike = new Citibike
	, stations = new Array()
	, lat = 40.74144387
	, lon = -73.97536082;

exports.index = function(req, res){
	citibike.getStations(null, function(data) {
	  stations = data["results"];
	  closestStation = null;
	  minDistance = 10000;

	  for(var i = 0; i < stations.length; i++) {
	  	distance = Math.abs(lat - stations[i].latitude) + Math.abs(lon - stations[i].longitude)
	  	if(distance < minDistance) {
	  		minDistance = distance;
	  		closestStation = stations[i];
	  	}
	  }


	  res.render('index', { title: 'CitiBike', stations: stations, closestStation: closestStation });
	});
  //res.render('index', { title: 'CitiBike', stations: stations });

};