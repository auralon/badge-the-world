$(document).ready(function() {

	var map = L.mapbox.map('map', 'echristensen.map-77cfk1ql', { tileLayer: { noWrap: false} }).setView([10, 10], 3);
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
