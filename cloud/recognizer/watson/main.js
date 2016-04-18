// IBM Watson image recognition

var request = require('request');

function toBuffer(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

function getTags(imageURL, imageID, completion) {
	try {
		request.get({ url: imageURL, encoding: null }, function(err, res, body){
			if (err)
				console.error(err);
			console.log("**************** " + typeof(body));
			var req = request.post({
				auth: {
					user: '738d4720-4a4e-4df4-80e9-721602ed1a72',
					pass: '2lgDXFABO35I',
					sendImmediately: true
				},
				url: 'https://gateway.watsonplatform.net/visual-recognition-beta/api/v2/classify?version=2015-12-02',
				method: 'POST',
				formData: {
					images_file: body
				}
				},
				function(error2, res2, body2) {
					if (!error2) {
					  console.log("Watson API success: " + JSON.stringify(body2));
					  if (body.code == "200")
					  	completion(null, [ { classes: [_.map(body.images.scores, function(a) { return a.name })] } ]);
					  else
					  	completion([{ classes: [] }]);
					}
					else
						completion([{ classes: [] }]);
				}
			);
		});
  	}
  	catch (e) {
		console.error(e);
  	}
}

exports.getTags = getTags
