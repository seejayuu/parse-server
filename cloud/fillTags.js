/* tagFiller
 * uses various 3rd party services to generate tags for images
 */
 
var user = require('./util/user.js');
 
var MAX_FROM_ONE_RECOGNIZER = 6
 
var user = require('./util/user.js');
var tag = require('./util/tag.js');
var recognizer1 = require('./recognizer/clarifai/main.js');
var recognizer2 = require('./recognizer/moodstocks/main.js');
var recognizer3 = require('./recognizer/watson/main.js');

var recognizers = [
	{ name: "Clarifai", module: recognizer1 },
	{ name: "Moodstocks", module: recognizer2 },
	{ name: "Watson", module: recognizer3 }
];

Parse.Cloud.afterSave("Post", function(request) {
	// see if user has Smart Tags enabled
	var poster = request.object.get("createdBy");
	user.getUser(poster.id, function(user) {
		if (!request.object.existed() && user.get("smartTags")) {
      for (i = 0; i < recognizers.length; i++) {
        (function(index) {
          console.log("Requesting from: " + recognizers[index].name);
          recognizers[index].module.getTags(request.object.get("itemImage").url(), request.object.id, function(tags) {
            // only use the top tags
            var relation = request.object.relation("tags");
            console.log("Tags from " + recognizers[index].name + ": " + JSON.stringify(tags[0]));
            var count = 0;
            var maxtags = Math.min(MAX_FROM_ONE_RECOGNIZER, tags[0].classes.length);
            for (j = 0; j < maxtags; j++) {
              // make sure each tag is saved if it doesn't already exist
              tag.tagRead(tags[0].classes[j], function(tagName, tagInfo) {
                if (tagInfo == null || tagInfo.length == 0) {
                  tag.tagCreate(tagName, recognizers[index].name, request.user, function(tagInfo) {
                    relation.add(tagInfo);
                    if (++count >= maxtags)
                      request.object.save();
                  }); 
                }
                else {
                  relation.add(tagInfo);
                  if (++count >= maxtags)
                    request.object.save();
                }
              });
            }
          });
        })(i);
      }
		}
	});	
});

Parse.Cloud.define("generateTags", function(request, response) {
	try {
		user.getObject("Post", request.params.photoId, function(result) {
			if (result) {
				var tagResults = [];
				var resultCount = 0;
				for (i = 0; i < recognizers.length; i++) {
					(function(index) {
					  console.log("Requesting from: " + recognizers[index].name);
					  recognizers[index].module.getTags(result.get("itemImage").url(), request.params.photoId, function(tags) {
						// only use the top tags
						console.log("Tags from " + recognizers[index].name + ": " + JSON.stringify(tags[0]));
						var maxtags = Math.min(MAX_FROM_ONE_RECOGNIZER, tags[0].classes.length);
						for (j = 0; j < maxtags; j++) {
							tagResults.push(tags[0].classes[j]);
						}
						if (++resultCount >= recognizers.length) {
							response.success(tagResults);
						}
					  });
					})(i);
				}
			}
			else
				response.error("Photo not found");
		});
	}
	catch (e) {
		console.error(e);
	}
});
