var twilio = require("twilio")("AC28b66c330d62ee62f59b0e61331bdb91", "2bbcd57f3090a0c8721c85ac5ecb4256");

Parse.Cloud.define("sendSMSToUser", function(request, response) {
 twilio.sendMessage({
    from: request.params.from,
    to: request.params.to,
    body: request.params.text
    }, function(err, responseData) {
		if (!err) {
			console.log("SMS Sent: from=" + request.params.from + " to=" + request.params.to + " body=" + request.params.text);
			response.success("SMS Sent");
		}
		else {
			console.log(err);
			response.error("SMS Send Failed");
		}
    }
  );
});
