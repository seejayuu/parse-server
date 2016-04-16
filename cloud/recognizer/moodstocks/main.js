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

var request = require('request');

function tagURL(imageURL, completion) {
	var obj = { image_url: imageURL };
  	request.post({
  	auth: {
  		user: api_key,
  		pass: api_secret,
  		sendImmediately: false
  	},
    url: "http://" + apiURL + searchPath,
    method: 'POST',
//    json: true,
//    body: obj
    body: Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&'),
    },
	function(error, response, body) {
		if (!error) {
		  console.log("Moodstocks API success: " + JSON.stringify(body));
		  completion(null, body);
		}
		else
			completion(err);
	}
  );
}

exports.getTags = getTags
