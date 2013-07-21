
/*
 * GET home page.
 */

var Citibike = require('citibike')
	, citibike = new Citibike
	, stations = new Array();

exports.index = function(req, res){
	citibike.getStations(null, function(data) {
	  stations = data["results"];
	  res.render('index', { title: 'CitiBike', stations: stations });
	});
  //res.render('index', { title: 'CitiBike', stations: stations });

};