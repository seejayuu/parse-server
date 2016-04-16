// recognizer interface to Clarifai image analysis service

var clientID = "EHNtuxjxYd7yJ0yvAJ9wbGzN85TNwMJN1FGEYZmk"
var clientSecret = "olrSt0EaGvtSaEBJ6Fy4UsoErfbBLFpDIHL6kbJO"
var apiURL = "api.clarifai.com"

var tagPath = "/v1/tag/";
var requestTokenPath = "/v1/token";

function getTags(imageURL, imageID, completion) {
	var results = []
	tagURL(imageURL , imageID, function(error, res) {
		console.log("*********************1");
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
	var obj = { client_id: clientID, client_secret: clientSecret, grant_type: "client_credentials"}
	Parse.Cloud.httpRequest({
		url: "https://" + apiURL + requestTokenPath,
		method: 'POST',
		body: Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&'),
		success: function(response) {
			console.log("*****************2");
			// upload the image and read back the tags
			Parse.Cloud.httpRequest({
				url: "https://" + apiURL + tagPath + '?access_token=' + response.data.access_token + '&url=' + imageURL,
				method: 'GET',
				success: function(response) {
					completion(null, response.data)
				},
				error: function(error) {
					console.error(error)
					completion(error)
				}
			});
		},
		error: function(error) {
			console.error(error)
		}
	});
}

exports.getTags = getTags
