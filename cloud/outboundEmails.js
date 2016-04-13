var client = require('./Mailgun.js');
var utils = require('./util/user.js');
var base64 = require('./util/base64.js');

Parse.Cloud.define("sendSignupEmail", function(request, response) {
  utils.getUser(request.params.userid, function(user) {
		var fs = require('fs');
		var ejsFileContents = fs.readFileSync('./cloud/views/signupEmail.ejs');
  		var EJS = require('ejs');
  		var  message =  EJS.render(ejsFileContents, { name: request.params.firstname, email: request.params.email, usercount: request.params.userid});
		client.sendEmail({
		  to: user.get("email"),
		  from: "Poppo <support@poppo.com>",
		  subject: "Welcome to Poppo!",
		  html: message
		}).then(function(httpResponse) {
		  response.success("Email sent"); 
		}, function(httpResponse) {
		  console.error(httpResponse);
		  response.error("Email send failed");
		});
  });
});

