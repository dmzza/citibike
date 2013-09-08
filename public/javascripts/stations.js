$(function() {
	  closestStation = null;
	  optimalStation = null;
	  nearbyStations = new Array();
	  nearbyStationIds = new Array();
	  minDistance = 10000;
	  minDifference = 10000;

	  /* I now have privacy, so I can insert comments like this one:
	  	I'm a Barbie girl, in the Barbie world
		Life in plastic, it's fantastic!
		You can brush my hair, undress me everywhere
		Imagination, life is your creation
		Come on Barbie, let's go party!
		*/

	  navigator.geolocation.getCurrentPosition(function(position) {

	  	lat = position.coords.latitude;
	  	lon = position.coords.longitude;


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
		  output = "<li>Your closest station is " + closestStation.label + " with " + closestStation.availableBikes + " bikes available. </li><li> Your best shot of a station with working docks and bikes is at " + optimalStation.label + "</li><li><img src='http://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lon + "&zoom=14&size=400x400&sensor=false&markers=color:blue%7Clabel:1%7C" + closestStation.latitude + "," + closestStation.longitude + "&markers=color:green%7Clabel:2%7C" + optimalStation.latitude + "," + optimalStation.longitude + "'></li>";
		  $("ol").html(output);
		});
});