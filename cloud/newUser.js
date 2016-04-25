var _ = require("underscore");

var MAX_ALBUMS = 2
var MAX_PHOTOS_PER_ALBUM = 2

Parse.Cloud.define("newUser", function(request, response) {
	var thisUser = request.user;
	var locations = [];
	console.log("newUser photo count=" + request.params.roll.length);
	// find all the locations in the camera roll, count the photos at each location, find length of time at location
	// { id: unique_id, location: location_string, date: time_taken }
	var count = 0;
	for (var i=0; i < request.params.roll.length; i++) {
		(function(i) {
			reverseGeocode(request.params.roll[i].location, function(geo) { request.params.roll[i].reverseLocation = geo.name; if (++count >= request.params.roll.length) geoDone(); });
		})(i);
	}
	function geoDone() {
		var albums = _.groupBy(request.params.roll, function(a) { return a.reverseLocation })
		albums = _.sortBy(albums, function(b) { return -b.length });
		if (albums.length > MAX_ALBUMS)
			albums.length = MAX_ALBUMS;
		_.each(albums, function(albumContents) {
			console.log("Album: " + albumContents[0].reverseLocation + " " + albumContents.length + " photos");
			// sort by date earliest to latest
			albumContents = _.sortBy(albumContents, function(a) { a.date });
			var Album = Parse.Object.extend("Album");
			var album = new Album();
			var worldACL = new Parse.ACL();
			worldACL.setPublicReadAccess(true);
			worldACL.setPublicWriteAccess(true);
			album.set("type", "album");
			album.set("comments", 0);
			var albumTitle = makeAlbumTitle(albumContents);
			album.set("title", albumTitle);
			album.setACL(worldACL);
			(function(reverseLocation) {
				console.log("******* album about to be saved");
				album.save(null, {
					success: function(album) {
						console.log("******* album saved");
						if (albumContents.length > MAX_PHOTO_PER_ALBUM)
							albumContents.length = MAX_PHOTOS_PER_ALBUM;
						_.each(albumContents, function(post) {
							console.log("saving photo: " + post.id + " album: " + reverseLocation);
							var Post = Parse.Object.extend("Post");
							var post = new Post();
							post.set("type", "post");
							post.set("title", reverseLocation);
							post.set("views", 0);
							post.set("comments", 0);
							post.set("likes", 0);
							post.set("postedAt", post.date);
							post.set("persistentID", post.id);
							post.setACL(worldACL);
							post.set("location", post.location);
							var relation = post.relation("albums");
							relation.add(album);
							post.save();
						});
					},
					error: function(album, error) {
						console.error("************ newUser: error creating album: " + JSON.stringify(error));
					}
				});
			})(albumTitle);
		});
	}
	response.success("Success");
});

var geocoder = require('./util/geocoder')({ database: __dirname + "/data/geocode.db" });

function reverseGeocode(location, callback) {
	geocoder.reverse(location.latitude, location.longitude).then(function(result) { callback(result) });
}


function makeAlbumTitle(album) {
	// album is already sorted earliest to latest
	var location = album[0].reverseLocation;
	try {
		var timeStart = new Date(album[0].date.iso);
		var timeEnd = new Date(album[album.length -1].date.iso);
		var hourDiff = timeEnd - timeStart;
		var secDiff = hourDiff / 1000; //in s
		var minDiff = hourDiff / 60 / 1000; //in minutes
		var hDiff = hourDiff / 3600 / 1000; //in hours
		var day = timeStart.getDay();
		var month = timeStart.getMonth();
		var year = timeStart.getYear();
		var startHour = timeStart.getHours();
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
		if (startHour >= 6 && startHour + hDiff < 12)
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
		if (hDiff > 21*24 && hDiff < 42*24)
			return "A month in " + location;
	}
	catch (e) {
		console.error(e);
	}
	return location;
}

