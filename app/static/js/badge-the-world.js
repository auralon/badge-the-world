$(document).ready(function() {

	var map = L.map('map', { tileLayer: { noWrap: false} }).setView([10, 10], 3);

	L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>. Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>',
	    maxZoom: 18
	}).addTo(map);

	var pledgeUrl = "/pledges";

	$.getJSON(pledgeUrl, function(data) {
		for (var i = 0; i < data.length; i++) {
			addLocation(data[i]);
		}
	});

	function addLocation(entry) {

		if (entry.lat !== "" && entry.lon !== "") {

			var description = '<pre>' + entry.idea.replace(/(?:\\[rn])+/g, "\r\n\r\n"); + '</pre><p>';

			if (entry.numberOfPeople) {
				description += '<br><br><b>Number of people impacted:</b> ' + entry.numberOfPeople + '<br>';
			}

			if (entry.created_at) {
				var date = new Date(entry.created_at);
				description += '<b>Date of pledge:</b> ' + date.toDateString() + '<br>';
			}

			if (entry.twitterHandle) {
				description += '<b>Twitter Username:</b> ' + entry.twitterHandle + '<br>';
			}

			description += '<a href="http://www.badgetheworld.org/?pledge=' + entry.uid + '">permalink</a>' +
						   '<a href="https://twitter.com/intent/tweet?text=Check out this pledge!&via=badgetheworld&hashtags=OpenBadges&url=http://www.badgetheworld.org?pledge=' + entry.uid + '" id="twitter-share">share on twitter</a><br>';

			var marker = L.mapbox.markerLayer({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [ entry.lon, entry.lat ]
				},
				properties: {
					title: entry.location,
					description: description,
					'marker-size': 'small',
					'marker-color': '#f0a'
				}
			}).addTo(map);

			if (entry.uid == pledge) {

				map.setView([entry.lat, entry.lon], 5);

				marker.eachLayer(function(m) {
					m.openPopup();
				});
			}

		}

	}
});
