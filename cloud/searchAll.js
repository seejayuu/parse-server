var _ = require("underscore");

Parse.Cloud.define("searchAll", function(request, response) {
	var Scope = {
		All: 0,
		Users: 1,
		Posts: 2,
		Albums: 3,
		Groups: 4
	};
	var filter = request.params.filter;
	var probe = request.params.probe;
	var user = request.user;
	var searchResults = [];
	var promises = [];
	function getQuery(className) {
		return new Parse.Query(Parse.Object.extend(className));
	}
	if (filter == Scope.All || filter == Scope.Posts) {
		// search posts and photos from roll
		function queryPostField(field) {
			var query = getQuery("Post");
			query.equalTo("createdBy", user).matches("title", "(?i)" + probe).matches("title", "(?i)" + probe);
			return query.find();
		}
		var tagQuery = getQuery("Tag");
		tagQuery.matches("name", "(?i)" + probe)
		//promises.push(tagQuery);		//TODO: This isn't right. Must find posts that contain these tags
		promises.push(queryPostField("title"));
		promises.push(queryPostField("notes"));
	}
	if (filter == Scope.All || filter == Scope.Albums || filter == Scope.Groups) {
		// search groups and albums
		function queryAlbumGroupField(type, field) {
			var query = getQuery("Album");
			query.equalTo("type", type);
			if (type == "album")
				query.equalTo("createdBy", user);
			query.matches(field,  "(?i)" + probe);
			return query.find()
		}
		if (filter != Scope.Groups) {
			promises.push(queryAlbumGroupField("album", "title"));
			promises.push(queryAlbumGroupField("album", "notes"));
		}
		if (filter != Scope.Albums) {
			promises.push(queryAlbumGroupField("group", "title"));
			promises.push(queryAlbumGroupField("group", "notes"));
		}
	}
	if (filter == Scope.All || filter == Scope.Users) {
		// search users
		function queryUserField(field) {
			var query = getQuery("_User");
			query.matches(field,  "(?i)" + probe);
			return query.find();
		}
		promises.push(queryUserField("username"));
		promises.push(queryUserField("email"));
		promises.push(queryUserField("name"));
	}
	Parse.Promise.when(promises).then(function(results) {
		// TODO: sort the results
		var finalResults = [];
		console.log("********");
		_.each(results, function accum(r) { finalResults = finalResults.concat(r) });
		console.log("finalResults count=" + finalResults.length);
		finalResults = _.uniqBy(finalResults, function(a) { console.log("id=" + JSON.stringify(a)); return "1" });
		console.log("********");
		_.sort(finalResults, function(a, b) { return a.get("createdAt") > b.get("createdAt") });
		console.log("********");
		response.success(finalResults);
		console.log("********");
	});
});
