Parse.Cloud.define("searchTags", function(request, response) {
	if (request.params.search == "") {
		response.success([]);
		return
	}
	getTags(request.params.search, function(tags) {
		var Post = Parse.Object.extend("Post");
		var query = new Parse.Query(Post);
		query.containedIn("tags", tags);
		query.find({
			success: function(posts) {
				console.log("Posts with tags=" + posts.length)
				response.success(posts)
			},
			error: function(object, error) {
	  		  console.log(error)
	  		  response.error(error)
			}
		});
	});
});

function getTags(searchString, completionBlock) {
	var User = Parse.Object.extend("Tag");
	var query = new Parse.Query(User);
	query.matches("name", "(?i)" + searchString)
	query.find({
  		success: function(tags) {
  			console.log("Tag results=" + tags.length)
  			completionBlock(tags)
		},
  		error: function(object, error) {
  		  console.log(error)
  		  completionBlock([])
		}
	});
}