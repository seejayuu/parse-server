var user = require('./util/user.js');

Parse.Cloud.define("getSkin", function(request, response) {
	console.log("getSkin installationId=" + request.params.installationId);
  try {
	  Parse.Cloud.useMasterKey()
	  var query = new Parse.Query("_Installation");
	  query.equalTo("installationId", request.params.installationId);
	  query.include("skin").include("user").include("user.skin");
	  query.find({
		success: function(results) {
			if (results.length > 0) {
				var result = results[0];
				var installationSkin = result.get("skin");
				if (!installationSkin)
					installationSkin = result.get("user").get("skin");
				console.log(JSON.stringify(installationSkin));
				response.success(installationSkin);
			}
			else {
				response.error("No skin found");
			}
		},
		error: function(error) {
			console.log(error);
			response.error(error);
		}
	  });	
  }
  catch (e) {
	console.error(e);
	response.error(e);
  }
});
 
Parse.Cloud.define("iosPush", function(request, response) {
  try {
	  var params = request.params;
	  var pushQuery = new Parse.Query(Parse.Installation);
	  pushQuery.equalTo('deviceType', 'ios'); // targeting iOS devices only
	  var user = new Parse.User();
	  user.id = params.toUser;                                                                                                                                         
	  pushQuery.equalTo('user', user)
	  delete params.toUser;
	  Parse.Cloud.useMasterKey()
	  var query = new Parse.Query("_Installation");
	  query.equalTo("installationId", params.installationId);
	  query.find({
		success: function(results) {
			try {
				var result = results[0];
		  if (params.badge == "Increment") {
			result.increment("badge");
			params.badge = result.get("badge");
		  }
		  else
			result.set("badge", params.badge);
		  delete params.installationId;
		  result.save();
		  Parse.Push.send({
			where: pushQuery, // Set our Installation query                                                                                                                                                              
			data: params
		  }, { success: function() {
			  console.log("#### PUSH OK");
		  }, error: function(error) {
			  console.log("#### PUSH ERROR" + error.message);
		  }, useMasterKey: true});
		  } catch(e){console.error(e);}
		},
		error: function(error) {
			console.log(error);
		}
	  });	
	  response.success('success');
  }
  catch (e) {
  	console.error(e);
  }
});

function getObject(className, userID, completionBlock) {
	var installation = Parse.Object.extend("_Installation");
	var query = new Parse.Query(Parse.Object.extend("_Installation"));
	query.get(userID, {
  		success: function(user) {
  			completionBlock(user)
		},
  		error: function(object, error) {
  		  console.log(className + "/" + userID + ": " + JSON.stringify(error))
  		  completionBlock(null)
		}
	});
}