var client = require('./Mailgun.js')(apiKey: 'key-f7f17e392715c4328b9274a4557d08a5', domain: 'sandbox4ba3cd71927a419db74f6a84e97973f6.mailgun.org');

Parse.Cloud.define("sendEmailToUser", function(request, response) {
  client.messages().send({
    to: request.params.to,
    from: request.params.from,
    subject: request.params.subject,
    text: request.params.text
  }, function(error, body) {
  	if (error) {
  		console.error(error);
    	response.error("Email send failed");
    }
    else {
    	response.success("Email sent");
    }
  });
});

  .then(function(httpResponse) {
    response.success("Email sent");
  }, function(httpResponse) {
    console.error(httpResponse);
    response.error("Email send failed");
  });
