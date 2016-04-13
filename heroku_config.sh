# set the Heroku configuration for Parse
heroku config:set PARSE_SERVER_DATABASE_URI='mongodb://parse_poppo:ZKKexhnSstcQSM2AcgtPsk4E@iad1-c17-2.mongo.objectrocket.com:51151,iad1-c17-1.mongo.objectrocket.com:51151,iad1-c17-0.mongo.objectrocket.com:51151/parseMigration?ssl=true'
heroku config:set PARSE_SERVER_APPLICATION_ID='r0KegEx2R4IO1Bk8ajoS'
heroku config:set PARSE_SERVER_FILE_KEY='ce4346de-4ca8-48ea-9c83-c3fe92d13ae2'
heroku config:set PARSE_SERVER_MASTER_KEY='yQpIBp1jYc0yRVpUZYYU'
heroku config:set PARSE_SERVER_CLOUD_CODE_MAIN='./cloud/main.js'
heroku config:set PARSE_SERVER_PUSH='{ "ios": { "pfx": "../Apple Push Service development certificate com.poppo.Poppo.p12", "bundleId": "com.poppo.Poppo", "production": "false" } }'
