Parse.Cloud.define("iosPush", function(request, response) {

  var params = request.params;
  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.equalTo('deviceType', 'ios'); // targeting iOS devices only
  var user = new Parse.User();
  user.id = params.toUser;                                                                                                                                         
  pushQuery.equalTo('user', user)
  delete params.toUser;
  Parse.Push.send({
    where: pushQuery, // Set our Installation query                                                                                                                                                              
    data: params
  }, { success: function() {
      console.log("#### PUSH OK");
  }, error: function(error) {
      console.log("#### PUSH ERROR" + error.message);
  }, useMasterKey: true});

  response.success('success');
});
