// recognizer interface to Moodstocks image analysis service

var api_key = "rhyn4dqidjhuoebkaxzu"
var api_secret = "CN9RoCqSn92TAkLg"
var apiURL = "api.moodstocks.com"

//curl --digest -u YourApiKey:YourApiSecret "http://api.moodstocks.com/v2/search" --form image_url="http://www.example.com/bar.jpg"


var searchPath = "/v2/search";

function getTags(imageURL, imageID, completion) {
	var results = []
	tagURL(imageURL , function(error, res) {
		if (error == null) {
		  if (res.found) {
		    completion([ { classes: [res.id] } ])
		  }
		  else
		    completion([{ classes: [] }])
		}
		else
		  completion([{ classes: [] }]);
	});
}

var digest = require('http-digest-client').createDigestClient(api_key, api_secret);

function tagURL(imageURL, completion) {
	var obj = { image_url: imageURL };
  digest.request({
    host: apiURL,
    path: searchPath,
    port: 80,
    method: 'POST',
    body: Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&'),
    success: function(response) {
      console.log("Moodstocks API success: " + JSON.stringify(response.data));
      completion(null, response.data);
    },
    error: function(error) {
      console.error("Moodstocks error: " + JSON.stringify(error));
      completion(error);
    }
  });
}

exports.getTags = getTags
