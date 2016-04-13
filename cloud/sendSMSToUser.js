var twilio = require("twilio")("AC28b66c330d62ee62f59b0e61331bdb91", "2bbcd57f3090a0c8721c85ac5ecb4256");

Parse.Cloud.define("sendSMSToUser", function(request, response) {
 twilio.sendSMS({
    From: request.params.from,
    To: request.params.to,
    Body: request.params.text
  }, {
    success: function(httpResponse) { response.success("SMS sent"); },
    error:   function(httpResponse) { console.log(httpResponse); response.error("SMS send failed"); }
  });
})