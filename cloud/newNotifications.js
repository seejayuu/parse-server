Parse.Cloud.define("newNotifications", function(request, response) {
	console.log("newNotifications: " + JSON.stringify(request.params));
	var userId = Parse.User.current();
	var query = new Parse.Query('Notification');
	query.equalTo("to", userId);
	query.greaterThan("createdAt", new Date(request.params.lastTime.iso));
	query.limit = 1;
	query.find({
		success: function(results) {
			if (results.length > 0) {
				console.log("Notification Log test: user=" + request.user + " status=" + results.length);
				response.success(true)
			}
			else {
				// now count logged views if there are no notifications
				var query = new Parse.Query('Log');
				query.equalTo("to", userId);
				query.greaterThan("createdAt", new Date(request.params.lastTime.iso));
				query.limit = 1;
				query.find({
					success: function(logResults) {
						console.log("Notification Log test: user=" + request.user + " status=" + logResults.length);
						response.success(logResults.length > 0);
					},
					error: function(error) {
						console.error(error);
						response.error(error);
					}				
				});
			}
		},
		error: function(error) {
			console.error(error);
			response.error(error);
		}
	});
});
