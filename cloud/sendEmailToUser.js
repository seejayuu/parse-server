var client = require('./Mailgun.js');
client.initialize('sandbox4ba3cd71927a419db74f6a84e97973f6.mailgun.org', 'key-f7f17e392715c4328b9274a4557d08a5');

console.log("**********************" + __dirname);

Parse.Cloud.define("sendEmailToUser", function(request, response) {
  client.sendEmail({
    to: request.params.to,
    from: request.params.from,
    subject: request.params.subject,
    text: request.params.text
  }).then(function(httpResponse) {
  	console.log("Email sent: to=" + request.params.to);
    response.success("Email sent");
  }, function(httpResponse) {
    console.error(httpResponse);
    response.error("Email send failed");
  });
});

