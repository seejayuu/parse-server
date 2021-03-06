'use strict';

var _DatabaseController = require('./Controllers/DatabaseController');

var _DatabaseController2 = _interopRequireDefault(_DatabaseController);

var _MongoStorageAdapter = require('./Adapters/Storage/Mongo/MongoStorageAdapter');

var _MongoStorageAdapter2 = _interopRequireDefault(_MongoStorageAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**  weak */
// Database Adapter
//
// Allows you to change the underlying database.
//
// Adapter classes must implement the following methods:
// * a constructor with signature (connectionString, optionsObject)
// * connect()
// * loadSchema()
// * create(className, object)
// * find(className, query, options)
// * update(className, query, update, options)
// * destroy(className, query, options)
// * This list is incomplete and the database process is not fully modularized.
//
// Default is MongoStorageAdapter.

var DefaultDatabaseURI = 'mongodb://localhost:27017/parse';

var dbConnections = {};
var databaseURI = DefaultDatabaseURI;
var appDatabaseURIs = {};
var appDatabaseOptions = {};

function setDatabaseURI(uri) {
  databaseURI = uri;
}

function setAppDatabaseURI(appId, uri) {
  appDatabaseURIs[appId] = uri;
}

function setAppDatabaseOptions(appId, options) {
  appDatabaseOptions[appId] = options;
}

//Used by tests
function clearDatabaseSettings() {
  appDatabaseURIs = {};
  dbConnections = {};
  appDatabaseOptions = {};
}

//Used by tests
function destroyAllDataPermanently() {
  if (process.env.TESTING) {
    var promises = [];
    for (var conn in dbConnections) {
      promises.push(dbConnections[conn].deleteEverything());
    }
    return Promise.all(promises);
  }
  throw 'Only supported in test environment';
}

function getDatabaseConnection(appId, collectionPrefix) {
  if (dbConnections[appId]) {
    return dbConnections[appId];
  }

  var dbURI = appDatabaseURIs[appId] ? appDatabaseURIs[appId] : databaseURI;

  var storageAdapter = new _MongoStorageAdapter2.default({
    uri: dbURI,
    collectionPrefix: collectionPrefix,
    mongoOptions: appDatabaseOptions[appId]
  });

  dbConnections[appId] = new _DatabaseController2.default(storageAdapter, {
    collectionPrefix: collectionPrefix
  });
  return dbConnections[appId];
}

module.exports = {
  getDatabaseConnection: getDatabaseConnection,
  setDatabaseURI: setDatabaseURI,
  setAppDatabaseOptions: setAppDatabaseOptions,
  setAppDatabaseURI: setAppDatabaseURI,
  clearDatabaseSettings: clearDatabaseSettings,
  destroyAllDataPermanently: destroyAllDataPermanently,
  defaultDatabaseURI: databaseURI
};