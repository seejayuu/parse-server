function getUser(postID, completionBlock) {
	getObject("_User", postID, completionBlock)
}

function getObject(className, userID, completionBlock) {
	var User = Parse.Object.extend(className);
	var query = new Parse.Query(User);
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

exports.getUser = getUser;
exports.getObject = getObject;
