var user = require('./util/user.js');
 
Parse.Cloud.define("iosPush", function(request, response) {
  try {
	  var params = request.params;
	  var pushQuery = new Parse.Query(Parse.Installation);
	  pushQuery.equalTo('deviceType', 'ios'); // targeting iOS devices only
	  var user = new Parse.User();
	  user.id = params.toUser;                                                                                                                                         
	  pushQuery.equalTo('user', user)
	  delete params.toUser;
	  var query = new Parse.Query(Parse.Object.extend("_Installation"), {useMasterKey:true});
	  query.equalTo("installationId", params.installationId);
	  query.find({
		success: function(result) {
		  if (params.badge == "Increment") {
			result.increment("badge");
			params.badge = result.get("badge");
		  }
		  else
			result.set("badge", params.badge);
		  delete params.installationId;
		  result.saveEventually();
		  Parse.Push.send({
			where: pushQuery, // Set our Installation query                                                                                                                                                              
			data: params
		  }, { success: function() {
			  console.log("#### PUSH OK");
		  }, error: function(error) {
			  console.log("#### PUSH ERROR" + error.message);
		  }, useMasterKey: true});
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