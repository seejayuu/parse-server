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
		query.equalTo("createdBy", user).equalTo("type", "post").include("createdBy");
		return query.find();
	}

	// get posts for users the current user is following
	function queryPost2() {
		var query = getQuery("Follow");
		query.equalTo("from", user).exists("to").notEqualTo("to", user).include("to");
		return query.find().then(function(results) {
			try {
				var users = _.filter(results, function(a) { return typeof(a) != "undefined" }).map(function(a) { return a.get("to")})
				var query = getQuery("Post");
				query.equalTo("type", "post").containedIn("createdBy", users).include("createdBy");
				return query.find();
			}
			catch (e) {
				console.log(e);
			}
		});
	}
	//get the albums and groups posted by users the current user is following and by the current user
	function queryPost2a() {
		var userQuery = getQuery("Follow");
		userQuery.equalTo("type", "user").equalTo("from", user).include("to");
		return userQuery.find().then(function(results) {
			try {
				var postingUsers = _.filter(results, function(a) { return typeof(a.get("to")) != "undefined"} ).map(function(b) { return b.get("to")});
				postingUsers.push(user)
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
	
	// get the posts blocked by this user
	function queryBlocks() {
		var blockQuery = getQuery("Block");
		blockQuery.equalTo("fromUser", user).exists("toPost").include("toPost");
		return blockQuery.find();
	}
	
	function followTarget(obj) {
    if (obj == null)
      return null;
    var retval = obj;
    if (obj.className == "Follow") {
      retval = obj.get("toAlbumGroup");
      if (retval == null)
        retval = obj.get("toPost");
      if (retval == null)
        retval = obj.get("to");
    }
	  return retval == null ? obj : retval.id;
  }
  	function getId(obj, field) {
  		if (obj == undefined)
  			return "";
  		var obj2 = obj.get(field);
  		if (obj2 == undefined)
  			return "";
  		return obj2.id;
  	}
	
	promises.push(queryPost1());
	if (!inProfile) {
		// get posts for users the current user is following
		promises.push(queryPost2());
		//get the albums and groups posted by users the current user is following
		promises.push(queryPost2a());
	}
	queryBlocks().then(function(blockList) {
		Parse.Promise.when(promises).then(function(results) {
			var finalResults = [];
			try {
				_.each(results, function accum(r) { finalResults = finalResults.concat(r) });
				finalResults = _.filter(finalResults, function(post) { return _.filter(blockList, function (i) { return i.get("toPost").id == post.id }).length == 0 } );
				// remove any shared albums or groups; leaving just posted albums or groups
				finalResults = _.filter(finalResults, function(post) { return post.get("type") == "post" || getId(post, "to") == getId(post, "from") } );
				finalResults = _.sortBy(_.uniq(finalResults, function (a) { return followTarget(a) }), function(a) { return a.get("fromRollAt") || a.get("createdAt") }).reverse();
			}
			catch (e) {
				console.log(e);
			}
			if (finalResults.length > MAX_RESULTS)
				finalResults.length = MAX_RESULTS;
			response.success(finalResults);
		});
	});
});
