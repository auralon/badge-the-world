$(document).ready(function() {
	var map = L.mapbox.map('map', 'echristensen.map-77cfk1ql', { tileLayer: { noWrap: false} }).setView([10, 10], 3);

	var pledgeUrl = "/pledges";
	$.getJSON(pledgeUrl, function(data) {
		for (var i = 0; i < data.length; i++) {
			addLocation(data[i]);
		}
	});

	function addLocation(entry) {
		var geocoder = L.mapbox.geocoder('echristensen.map-77cfk1ql');
		var address = "";
		if (entry.postcode != "") address += entry.postcode;
		if ((address == "") && (entry.location != "")) address += entry.location;

		if (address != "") {
			geocoder.query(address, function(err, result) {
				if (err) {
					return false;
				}

				var description = '<pre>' + entry.idea + '</pre><p>';

				if (entry.numberOfPeople) {
					description += '<b>Number of people impacted:</b> ' + entry.numberOfPeople + '<br>';
				}
				
				if (entry.created_at) {
					var date = new Date(entry.created_at);
					description += '<b>Date of pledge:</b> ' + date.toDateString() + '<br>';
				}

				if (entry.twitterHandle) {
					description += '<b>Twitter Username:</b> ' + entry.twitterHandle + '<br>';
				}

				var marker = L.mapbox.markerLayer({
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [ result.latlng[1], result.latlng[0] ]
					},
					properties: {
						title: address,
						description: description,
						'marker-size': 'small',
						'marker-color': '#f0a'
					}
				}).addTo(map);

				if (entry._id == pledge) {

					map.setView([result.latlng[0], result.latlng[1]], 5);

					marker.eachLayer(function(m) {
						m.openPopup();
					});
				}
			});
		}


	}
});