// searchAll.js
//
// Cloud function that searches all Posts, Albums, Groups and Users for a term

var _ = require("underscore");

Parse.Cloud.define("searchAll", function(request, response) {
	console.log("searchAll: params=" + JSON.stringify(request.params));
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
		// search all tags and then see which posts contain those tags
		var tagQuery = getQuery("Tag");
		tagQuery.matches("name", "(?i)" + probe)
    var postQuery = getQuery("Post");

    promises.push(Parse.Promise.when(tagQuery).then({ function(results) { return postQuery.containedIn("tags", results).find() } }));
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
			// search album titles and notes that have been shared with the current user
			var followQuery = getQuery("Follow");
			followQuery.equalTo("type", "ag").equalTo("to", user);
      // following line needs to do the regex match
      var re = new RegExp("(?i)");
			promises.push(followQuery.find().then(function(results) { 
			  return _.map(results, function(item) {
			    return item.get("toAlbumGroup")
			  }).filter(function(item) {
			      return re.test(item.get("title")) || re.test(item.get("notes"))
			  }) 
			}));
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
		var finalResults = [];
		try {
			_.each(results, function accum(r) { finalResults = finalResults.concat(r) });
			finalResults = _.sortBy(_.uniq(finalResults, function (a) { return a.id }), function(a) { return a.get("createdAt") }).reverse();
		}
		catch (e) {
			console.log(e);
		}
		response.success(finalResults);
	});
});
