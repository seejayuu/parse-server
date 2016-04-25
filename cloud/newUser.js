var _ = require("underscore");

var MAX_ALBUMS = 2
var MAX_PHOTOS_PER_ALBUM = 2

Parse.Cloud.define("newUser", function(request, response) {
	var thisUser = request.user;
	var locations = [];
	// find all the locations in the camera roll, count the photos at each location, find length of time at location
	// { id: unique_id, location: location_string, date: time_taken }
	var albums = _.groupBy(request.params.roll, function(a) { return a.location }).sortBy(function(b) { -b.length });
	if (albums.length > MAX_ALBUMS)
		albums.length = MAX_ALBUMS;
	_.each(albums, function(albumContents) {
		console.log("Album: " + albumContents[0].location + " " + albumContents.length + " photos");
		// sort by date earliest to latest
		albumContents = _.sortBy(album, function(a) { a.date });
		var album = Parse.Object.extend("Album");
		var worldACL = new Parse.ACL();
		worldACL.setPublicReadAccess(true);
		worldACL.setPublicWriteAccess(true);
		album.setACL(worldACL);
		album.save({ type: "album", title: makeAlbumTitle(albumContents), comments: 0, likes: 0 } , {
			success: function(album) {
				if (albumContents.length > MAX_PHOTO_PER_ALBUM)
					albumContents.length = MAX_PHOTOS_PER_ALBUM;
				_.each(albumContents, function(post) {
					var post = Parse.Object.extend("Post");
					post.set("type", "post");
					post.set("views", 0);
					post.set("comments", 0);
					post.set("likes", 0);
					post.set("postedAt", post.date);
					post.set("persistentID", post.id);
					post.setACL(worldACL);
					reverseGeocode(albumContents[0].location, function(result) {
						console.log("******* Geolocation: " + result);
						post.set("location", result);
						post.save();
					});
				});
			},
			error: function(album, error) {
				console.error("************ newUser: error creating album: " + JSON.stringify(error));
			}
  		});
	});
	response.success("Success");
});

var geocoder = require('offline-geocoder')({ database: __dirname + "/data/geocode.db" });

function reverseGeocode(location, callback) {
	console.log("**** geo lookup lat=" + location.latitude + " long=" + location.longitude);
	geocoder.reverse(location.latitude, location.longitude).then(callback(result));
}


function makeAlbumTitle(album) {
	// album is already sorted earliest to latest
	var timeStart = new Date(album[0].date);
	var timeEnd = new Date(album[album.length -1].date);
	var secDiff = hourDiff / 1000; //in s
	var minDiff = hourDiff / 60 / 1000; //in minutes
	var hDiff = hourDiff / 3600 / 1000; //in hours
	var day = timeStart.getDay();
	var month = timeStart.getMonth();
	var year = timeStart.getYear();
	var startHour = timeStart.getHours();
	var location = album[0].location;
	// holidays, thanksgiving, New Years, christmas July 4th etc, birthday
	var holidays = [
		{ name: "July 4th", start: "7/4", duration: 1 },
		{ name: "Christmas", start: "12/24", duration: 7 },
		{ name: "New Year", start: "12/31", duration: 2 },
	];
	var holiday = _.filter(holidays, function(h) {
		return day >= h.start && day < h.start + h.duration;
	});
	if (holiday.length > 0) {
		return holiday[0].name + " " + year;
	}
	// todo: variable holidays: Memorial Day, Easter, Labor Day, Thanksgiving
	if (starthour >= 6 && startHour + hDiff < 12)
		return "A morning in " + location;
	if (startHour >= 12 && startHour + hDiff < 18)
		return "An afternoon in " + location;
	if (startHour >= 18 && hDiff < 6)
		return "An evening in " + location;
	if (startHour >= 18 && hDiff < 12)
		return "A night in " + location;
	if (hDiff > 6 && hDiff < 24)
		return "A day in " + location;
	if (hDiff > 4*24 && hDiff < 10*24)
		return "A week in " + location;
	if (hdiff > 21*24 && hDiff < 42*24)
		return "A month in " + location;
	return location;
}

