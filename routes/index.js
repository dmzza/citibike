
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
	  optimalStation = null;
	  nearbyStations = new Array();
	  nearbyStationIds = new Array();
	  minDistance = 10000;
	  minDifference = 10000;

	  for(var i = 0; i < stations.length; i++) {
	  	distance = Math.abs(lat - stations[i].latitude) + Math.abs(lon - stations[i].longitude)
	  	if(distance < minDistance) {
	  		minDistance = distance;
	  		closestStation = stations[i];
	  	}
	  }

	  for(var i = 0; i < closestStation.nearbyStations.length; i++) {
	  	nearbyStationIds.push(closestStation.nearbyStations[i].id);
	  }

	  nearbyStations.push(closestStation);
	  for(var i = 0; i < stations.length; i++) {
	  	if(nearbyStationIds.indexOf(stations[i].id) >= 0) {
	  		nearbyStations.push(stations[i])
	  	}
	  }

	  for(var i = 0; i < nearbyStations.length; i++) {
	  	difference = Math.abs(nearbyStations[i].availableBikes - nearbyStations[i].availableDocks)
	  	if(difference < minDifference) {
	  		optimalStation = nearbyStations[i];
	  		minDifference = difference;
	  	}
	  }



	  res.render('index', { title: 'CitiBike', stations: stations, closestStation: closestStation, nearbyStations: nearbyStations, optimalStation: optimalStation });
	});

};