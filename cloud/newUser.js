var _ = require("underscore");

var MAX_ALBUMS = 8
var MAX_PHOTOS_PER_ALBUM = 2
var ALBUM_SIZE_THRESHOLD = 3

Parse.Cloud.define("newUser", function(request, response) {
	var thisUser = request.user;
	var tzoffset = request.params.tzoffset;
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
		_.each(getAlbumSubset(request.params.roll), function(albumContents) {
			console.log("Album: " + albumContents[0].reverseLocation + " " + albumContents.length + " photos");
			// sort by date earliest to latest
			albumContents = _.sortBy(albumContents.reverse(), function(a) { a.date.iso });
			var Album = Parse.Object.extend("Album");
			var album = new Album();
			var worldACL = new Parse.ACL();
			worldACL.setPublicReadAccess(true);
			worldACL.setPublicWriteAccess(true);
			album.set("type", "album");
			album.set("comments", 0);
			album.set("createdBy", thisUser);
			album.set("persistentID", albumContents[0].id);
			var albumTitle = makeAlbumTitle(albumContents, tzoffset);
			album.set("title", albumTitle);
			album.setACL(worldACL);
			(function(reverseLocation) {
				album.save(null, {
					success: function(album) {
					console.log("******* album saved, length = " + albumContents.length);
						if (albumContents.length > MAX_PHOTOS_PER_ALBUM)
							albumContents.length = MAX_PHOTOS_PER_ALBUM;
						_.each(albumContents, function(albumPost) {
							try {
								console.log(JSON.stringify(albumPost));
								console.log("saving photo: " + albumPost.id + " album: " + reverseLocation);
								var Post = Parse.Object.extend("Post");
								var post = new Post();
								post.set("type", "post");
								post.set("title", reverseLocation);
								post.set("views", 0);
								post.set("comments", 0);
								post.set("likes", 0);
								post.set("createdBy", thisUser);
								post.set("postedAt", albumPost.date);
								post.set("persistentID", albumPost.id);
								post.setACL(worldACL);
								var point = new Parse.GeoPoint({latitude: albumPost.location.latitude, longitude: albumPost.location.longitude});
								post.set("location", point);
								var relation = post.relation("albums");
								relation.add(album);
								post.save();
							}
							catch (e) {
								console.error(e);
							}
						});
					},
					error: function(album, error) {
						console.error("************ newUser: error creating album: " + JSON.stringify(error));
					}
				});
			})(albumTitle);
		});
	}
	// now join the new user to the groups that are owned by the admin user
	var Album = Parse.Object.extend("Album");
	var query = new Parse.Query(Album);
	var owner = new Parse.User();
	owner.id = "EM0YoC7bp3"; 
	query.equalTo("type", "group").equalTo("createdBy", owner);
	query.find({
  		success: function(groups) {
  			for (var i=0; i < groups.length; i++) {
  				var group = groups[i];
				var Follow = Parse.Object.extend("Follow");
				var follow = new Follow();
				var worldACL = new Parse.ACL();
				worldACL.setPublicReadAccess(true);
				worldACL.setPublicWriteAccess(true);
				follow.setACL(worldACL);
				follow.set("type", "ag");
				follow.set("from", owner);
				follow.set("to", thisUser);
				follow.set("toAlbumGroup", group);
				console.log("Sharing group: " + group.get("title"));
				follow.save();
			}
		},
  		error: function(object, error) {
  		  console.log(error)
		}
	});
	response.success("Success");
});

var geocoder = require('./util/geocoder')({ database: __dirname + "/data/geocode.db" });

function reverseGeocode(location, callback) {
	geocoder.reverse(location.latitude, location.longitude).then(function(result) { callback(result) });
}

function makeAlbumTitle(album, tzoffset) {
	// album is already sorted earliest to latest
	var location = album[0].reverseLocation;
	if (location === undefined)
		location = "my life";
	try {
		var millisecondOffset = tzoffset * 1000;
		var timeEnd = new Date(album[0].date.iso) + millisecondOffset;
		var timeStart = new Date(album[album.length -1].date.iso) + millisecondOffset;
		var hourDiff = timeEnd - timeStart;
		var secDiff = hourDiff / 1000; //in s
		var minDiff = secDiff / 60 
		var hDiff = minDiff / 60
		var day = timeStart.getDay();
		var month = timeStart.getMonth();
		var year = timeStart.getYear();
		var startHour = timeStart.getHours();
		
		console.log("******makeAlbumTitle: start=" + timeStart + " end=" + timeEnd + " hDiff=" + hDiff + " startHour=" + startHour); 
		
		
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

// get the list of albums to create albums for
// album selection rules:
// 1 largest
// 1 most recent
// 6 random

function getAlbumSubset(roll) {
	try {
		var albums = _.groupBy(roll, function(a) { return a.reverseLocation })
		albums = _.sortBy(albums, function(b) { return -b.length });
		var subset = [albums[0]];	// the biggest
		albums.splice(0,1);	// remove it
		var lastDate = "";
		var lastIndex = 0;
		for (var i = 0; i < albums.length; i++) {
			if (albums[i][0].date.iso > lastDate) {
				lastDate = albums[i][0].date.iso
				lastIndex = i
			}	
		}
		// select the album with the most recent first photo
		if (lastDate != "") {
			subset.push(albums[lastIndex]);
			albums.splice(lastIndex, 1);
		}
		// select some random albums
		var count = MAX_ALBUMS - 2;
		while (albums.length > 0 && count > 0) {
			var choice = Math.floor((Math.random() * albums.length));
			if (albums[choice].length >= ALBUM_SIZE_THRESHOLD) {
				subset.push(albums[choice]);
				albums.splice(choice, 1);
				count--;
			}
		}
		console.log(JSON.stringify(subset));
		return subset;
	}
	catch (e) {
		console.log(e);
		return [];
	}
}