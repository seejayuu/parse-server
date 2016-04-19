var user = require('./util/user.js');

Parse.Cloud.define("getSkin", function(request, response) {
	console.log("*************getSkin installationId=" + request.params.installationId);
  try {
	  var params = request.params;
	  Parse.Cloud.useMasterKey()
	  var query = new Parse.Query("_Installation");
	  query.equalTo("installationId", params.installationId);
	  query.include("skin");
	  query.find({
		success: function(results) {
			console.log(JSON.stringify(results));
			response.success(results[0].get("skin"));
		},
		error: function(error) {
			console.log(error);
		}
	  });	
  }
  catch (e) {
	console.error(e);
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
		  console.log("*******************1");
			result.increment("badge");
		  console.log("*******************2");
			params.badge = result.get("badge");
		  }
		  else
			result.set("badge", params.badge);
		  delete params.installationId;
		  console.log("*******************3");
		  result.save();
		  console.log("*******************4");
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