// recognizer interface to Clarifai image analysis service

var clientID = "EHNtuxjxYd7yJ0yvAJ9wbGzN85TNwMJN1FGEYZmk"
var clientSecret = "olrSt0EaGvtSaEBJ6Fy4UsoErfbBLFpDIHL6kbJO"
var apiURL = "api.clarifai.com"

var tagPath = "/v1/tag/";
var requestTokenPath = "/v1/token";

var request = require('request');

function getTags(imageURL, imageID, completion) {
	var results = []
	tagURL(imageURL , imageID, function(error, res) {
		if (error == null) {
			// if some images were successfully tagged and some encountered errors,
			// the status_code PARTIAL_ERROR is returned. In this case, we inspect the
			// status_code entry in each element of res["results"] to evaluate the individual
			// successes and errors. if res["status_code"] === "OK" then all images were 
			// successfully tagged.
			if( typeof res["status_code"] === "string" && 
				( res["status_code"] === "OK" || res["status_code"] === "PARTIAL_ERROR" )) {
				// the request completed successfully

				for( i = 0; i < res.results.length; i++ ) {
					if( res["results"][i]["status_code"] === "OK" ) {
						results.push({classes: res["results"][i].result["tag"]["classes"], probs: res["results"][i].result["tag"]["probs"]})
						console.log( 'docid='+res.results[i].docid +
							' local_id='+res.results[i].local_id +
							' tags='+res["results"][i].result["tag"]["classes"] )
					}
					else {
						console.log( 'docid='+res.results[i].docid +
							' local_id='+res.results[i].local_id + 
							' status_code='+res.results[i].status_code +
							' error = '+res.results[i]["result"]["error"] )
					}
				}
			}
		}
		completion(results)
	});
}

function tagURL(imageURL, imageID, completion) {
	// get the session token
	try {
		request.post("https://" + apiURL + requestTokenPath,
			{
				form: { client_id: clientID, client_secret: clientSecret, grant_type: "client_credentials"}
			},
			function(error, response, body) {
				// upload the image and read back the tags
				console.log("*************** " + JSON.parse(body).access_token);
				request("https://" + apiURL + tagPath + '?access_token=' + JSON.parse(body).access_token + '&url=' + imageURL,
					function(error, response, body) {
						console.log(body);
						if (error)
							completion(error);
						else
							completion(null, body)
					}
				);
			}
		);
	}
	catch (e) {
		console.error(e);
	}
}

exports.getTags = getTags
