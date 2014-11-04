var Hapi = require('hapi');
var Joi = require('joi');
var security = require('./lib/security.js');

var config;
var server;

module.exports.testRequest = function( options, callback ) {
  server.inject( options, function( res ){
    callback(res);
  });
};

module.exports.getMessage = function( identifier ) {
  if( config ) {
    return config.messages[identifier];
  }
  else return null;
}

module.exports.stopServer = function() {
  server.stop({ timeout: 100 }, function () {
    security.clearAuthorizations();
  });
}

module.exports.loadConfig = function( path ) {
    if( path ){
        try {
            config = require( path );
        }catch( err ) {
            console.log( "Error loading config file at: [" + path +"], using default config" );
            config = require('./config.json');
        }
    }
    else {
        config = require('./config.json');
    }
};

module.exports.start = function() {
  if( !config ) module.exports.loadConfig();

  server = new Hapi.Server(config.server.host, config.server.port, { app : config });

  /* add services to the API */

  Object.keys(config).forEach(function(key) {
    var service_config = config[key];
    if( service_config.file_path ) {
      var service = require( service_config.file_path );
      service.path = service_config.post_path;

      var auth = { "permissions" : service_config.permissions,
                   "enabled" : service_config.enabled,
                   "token" : service_config.token };
      try {
        security.addAuthorization( service_config.post_path, auth );
        server.route(service);
      } catch( ex ) {
        console.log( "Exception loading authorizations: " + ex );
      }

    }
  });

  server.ext('onRequest', function (request, next) {
      var app = request.server.settings.app;
      if( security.validateHeaders( request ) && request.method === 'post' ) {
        next();
      }
      else {
        next( { "text" : app.messages.request_denied } );
      }
  });

  server.ext('onPreHandler', function (request, next) {
      var app = request.server.settings.app;
      var auth = security.lookupAuthorization( request.path, request.params );
      var result = security.checkPermissions( request, auth );

      switch( result ) {
        case 'ok' : next(); break;
        case 'ignore' : next( { "text" : "" } ); break;
        case 'service_disabled' : next( { "text" : app.messages.service_disabled } ); break;
        case 'access_denied' : next( { "text" : app.messages.access_denied } );
        default : next( { "text" : "" } ); break;
      }

  });

  server.start(function () {
      //console.log('Slack Command Line Server running at:', server.info.uri);
  });

}


