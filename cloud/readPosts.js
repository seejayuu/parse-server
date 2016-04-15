var _ = require("underscore");

var MAX_RESULTS = 100;

Parse.Cloud.define("readPosts", function(request, response) {
	console.log("readPosts: params=" + JSON.stringify(request.params));
	var inProfile = request.params.inProfile;
	var user = new Parse.User();
  	user.id = request.params.user;  
	var searchResults = [];
	var promises = [];
	function getQuery(className) {
		return new Parse.Query(Parse.Object.extend(className));
	}

	// get the current users's posts
	function queryPost1() {
		var query = getQuery("Post");
		query.equalTo("createdBy", user).equalTo("type", "post").equalTo("createdBy", user).include("createdBy");
		return query.find();
	}

	// get posts for users the current user is following
	function queryPost2() {
		var query = getQuery("Follow");
		query.include("to").equalTo("from", user).exists("to").notEqualTo("to", user);
		return query.find().then(function(results) {
			try {
				var users = _.filter(results, function(a) { return typeof(a) != "undefined" }).map(function(a) { return a.get("to")})
				console.log("******************** queryPost2 users=" + users.length);
				var query = getQuery("Post");
				query.equalTo("createdBy", user).equalTo("type", "post").containedIn("createdBy", users).include("createdBy");
				return query.find();
			}
			catch (e) {
				console.log(e);
			}
		});
	}
	//get the albums and groups posted by users the current user is following
	function queryPost2a() {
		var userQuery = getQuery("Follow");
		userQuery.equalTo("type", "user").equalTo("from", user).include("to");
		return userQuery.find().then(function(results) {
			try {
				var postingUsers = _.filter(postingUsers, function(a) { typeof(a.get("to")) != "undefined"} ).map(function(b) { return b.get("to")});
				console.log("******************** queryPost2a users=" + postingUsers.length);
				var followQuery = getQuery("Follow");
				followQuery.notEqualTo("type", "user").containedIn("from", postingUsers)
				followQuery.include("toAlbumGroup").include("toPost").include("toPost.createdBy").include("toAlbumGroup.createdBy");
				return followQuery.find();
			}
			catch (e) {
				console.log(e);
			}
		});
	}
	
	// get the albums/groups that the current user has posted
	function queryPost3() {
		var query = getQuery("Follow");
		query.include("toAlbumGroup").include("toPost").include("toPost.createdBy").include("toAlbumGroup.createdBy");
		query.notEqualTo("type", "user").equalTo("from", user).equalTo("to", user);
		return query.find();
	}
	promises.push(queryPost1());
	if (!inProfile) {
		// get posts for users the current user is following
		promises.push(queryPost2());
		//get the albums and groups posted by users the current user is following
		promises.push(queryPost2a());
		// get the albums/groups that the current user has posted
		promises.push(queryPost3());
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
		if (finalResults.length > MAX_RESULTS)
			finalResults.length = MAX_RESULTS;
		response.success(finalResults);
	});
});
