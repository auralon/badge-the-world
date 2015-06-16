$(document).ready(function() {
	var pledgeUrl = "/getPledges";
	$.getJSON(pledgeUrl, function(data) {

		for (var i = 0; i <=  data.length -1; i++) {

			var row = '<tr>'
					+ '<td><ul><li>' + data[i].fiveWays.split(", ").join('</li><li>') + '</li></ul></td>'
					+ '<td>' + data[i].idea + '</td>'
					+ '<td>' + data[i].topic + '</td>'
					+ '<td>' + data[i].numberOfPeople + '</td>'
					+ '<td>' + data[i].location + '</td>'
					+ '<td>' + data[i].email + '</td>'
					+ '<td>' + data[i].name + '</td>'
					+ '<td>' + data[i].twitterHandle + '</td>'
					+ '<td>' + data[i].organisation + '</td>'
					+ '<td><ul><li>' + data[i].share.split(", ").join('</li><li>') + '</li></ul></td>'
					+ '<td>' + new Date(data[i].created_at).toISOString().substr(0, 19).replace('T', ' ') + '</td>'
					+ '<td><a href="/update?pledge=' + data[i].uid + '">Edit</a>&nbsp;<a href="#" data-id="' + data[i].uid + '" class="delete">Delete</a>'
					+ '</tr>'

			$('table').append($(row));
		};

	});
});
