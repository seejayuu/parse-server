Parse.Cloud.define("newNotifications", function(request, response) {
	var userId = Parse.User.current();
	var query = new Parse.Query('Notification');
	query.equalTo("to", userId);
	query.greaterThan("createdAt", new Date(request.params.lastTime.iso));
	query.limit = 1;
	query.find({
		success: function(results) {
			// now count logged views
			var query = new Parse.Query('Log');
			query.equalTo("to", userId);
			query.greaterThan("createdAt", new Date(request.params.lastTime.iso));
			query.limit = 1;
			query.find({
				success: function(logResults) {
					response.success(results.length + logResults.length > 0);
				},
				error: function(error) {
					console.error(error);
					response.error(error);
				}				
			});
		},
		error: function(error) {
			console.error(error);
			response.error(error);
		}
	});
});
