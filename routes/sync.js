var Citibike = require('citibike')
	, citibike = new Citibike
	, mongo = require('mongodb')
	, stations = new Array();

var mongoUri = process.env.MONGOLAB_URI ||
		process.env.MONGOHQ_URL ||
		'mongodb://localhost/citibike';

exports.index = function(req, res){
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

        stationCollection.findOne({"id": station["id"]}, function(err, stationRecord) {
          try {
          if (err) throw err;
          if(stationRecord === null) throw "missing station";

          // TODO: UPDATE OR CREATE EACH STATION HERE

          } catch(err) {
          console.log(err);
          res.send(500);
          };
        };
      }

      } catch(err) {
      console.log(err);
      res.send(500);
      };
    };
	};
};