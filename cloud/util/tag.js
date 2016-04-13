function getUser(postID, completionBlock) {
	getObject("_User", postID, completionBlock)
}

function tagRead(tagName, completionBlock) {
	var tagObject = Parse.Object.extend("Tag");
	var query = new Parse.Query(tagObject);
	query.equalTo("name", tagName);
	console.log("Find: " + tagName);
	query.find({
  		success: function(tag) {
  			console.log("Tag " + (tag.length > 0 ? "" : "not ") + "found: " + tagName);
  			completionBlock(tagName, tag)
		},
  		error: function(object, error) {
  			console.log("Error finding tag");
  		  completionBlock(tagName, null)
		}
	});
}

function tagCreate(tagName, tagSource, user, completionBlock) {
	var tagObject = Parse.Object.extend("Tag");
	var newTag = new tagObject();
	newTag.set("source", tagSource);
	newTag.set("name", tagName);
	newTag.set("createdBy", user);
	newTag.save(null, {
		success: function(tag) {
			completionBlock(tag);
		}
	});
}


exports.tagRead = tagRead
exports.tagCreate = tagCreate
