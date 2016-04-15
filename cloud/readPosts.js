
var MAX_RESULTS = 100;

Parse.Cloud.define("readPosts", function(request, response) {
	var inProfile = request.params.inProfile;
	var user = request.params.user;
	var searchResults = [];
	var promises = [];
	function getQuery(className) {
		return new Parse.Query(Parse.Object.extend(className));
	}

	// get the current users's posts
	function queryPost1() {
		var query = getQuery("Post");
		query.equalTo("createdBy", user).equalTo("type", "post").equalTo("createdBy", user).include("createdBy");
		
		console.log("**************** queryPost1");
		
		return query.find();
	}

	// get posts for users the current user is following
	function queryPost2() {
		var query = getQuery("Follow");
		query.include("to").equalTo("from", user).exists("to").notEqualTo("to", user);
		
		console.log("**************** queryPost2");
		
		return query.find().then(function(results) {
			console.log("**************** queryPost2 then");
			return _.filter(results, function(a) { return typeof(a) != "undefined" }).map(function(a) { return a.get("to")})
		}).then(function(results) { var query = getQuery("Post");
			query.equalTo("createdBy", user).equalTo("type", "post").containedIn("createdBy", results).include("createdBy");

			console.log("**************** queryPost2 then then");

			return query.find();
		});
	}
	
	//get the albums and groups posted by users the current user is following
	function queryPost2a() {
		var userQuery = getQuery("Follow");
		userQuery.equalTo("type", "user").equalTo("from", user).include("to");
				
		console.log("**************** queryPost2a");
		

		return query.find().then(function(results) {
			var postingUsers = _.filter(postingUsers, function(a) { typeof(a.get("to")) != "undefined"} ).map(function(b) { return b.get("to")});
			var followQuery = getQuery("Follow");
			followQuery.notEqualTo("type", "user").containedIn("from", postingUsers)
			followQuery.include("toAlbumGroup").include("toPost").include("toPost.createdBy").include("toAlbumGroup.createdBy");
				
		console.log("**************** queryPost2a then");
		
			return query.find(); 
		});
	}
	
	// get the albums/groups that the current user has posted
	function queryPost3() {
		var query = getQuery("Follow");
		query.include("toAlbumGroup").include("toPost").include("toPost.createdBy").include("toAlbumGroup.createdBy");
		query.notEqualTo("type", "user").equalTo("from", user).equalTo("to", user);
				
		console.log("**************** queryPost3");
		

		return query.find();
	}
	
	promise.push(queryPost1());
	
	if (!inProfile) {
		// get posts for users the current user is following
		promise.push(queryPost2());
		//get the albums and groups posted by users the current user is following
		promise.push(queryPost2a());
		// get the albums/groups that the current user has posted
		promise.push(queryPost3());
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
