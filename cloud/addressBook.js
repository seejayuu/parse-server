// Takes an array of email addresses and returns a dictionary of email addresses that are already poppo users
// excludes users that the current user is already following
Parse.Cloud.define("findPoppoUsers", function(request, response) {
  var followQuery = new Parse.Query("Follow");
  followQuery.equalTo("from", request.user).equalTo("type", "user")
  followQuery.find().then( function(result) {
  	var query = new Parse.Query('_User');
	  query.containedIn("email", request.params.emailaddresses);
	  query.limit = 1000;
	  query.find({
		  success: function(results) {
			  var emails = {};
			  var followIds = _.map(results, function(item) { return item.id });
			  for (var i = 0; i < results.length; i++) {
			    if !_.find(followIds, function(id) { return id == results[i].id })
				    emails[results[i].get("email")] = results[i];
			  }
			  response.success(emails)
		  },
		  error: function(error) {
			  response.error(error)
		  }
	  });
	});
});

// add a list of current poppo users as being followed by a user
// Called with a user id and an array of user ids
Parse.Cloud.define("addFollowedUsers", function(request, response) {
	var followArray = [];
	var follows = request.params.userIds
	for (var i = 0; i < follows.length; i++) {
		var Follow = Parse.Object.extend("Follow");
		var newFollow = new Follow();
		newFollow.set("type", "user");
		newFollow.set("from", { __type: "Pointer", className: "_User", objectId: request.params.user });
		newFollow.set("to", { __type: "Pointer", className: "_User", objectId: follows[i] });
		followArray.push(newFollow);
	}
	Parse.Object.saveAll(followArray, {
        success: function(objs) {
			response.success('{ "status": "ok" }');
        },
        error: function(error) { 
			response.error(error);
        }
    });
});

