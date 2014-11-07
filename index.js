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
  console.debug( 'Service Stopped' );
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
    if( config.server.debug ) console.debug = console.log;
    else console.debug = function() {};
};

module.exports.loadServices = function( config ) {

    Object.keys(config).forEach(function(key) {
      var service_config = config[key];
      if( service_config.file_path ) {
        var service;
        try {
          service = require( service_config.file_path );
        } catch( ex ) {
          console.debug( "Exception loading service: " + ex );
        }
        if( service ){
          service.path = service_config.post_path;
          try {
            security.addAuthorization( service_config );
            server.route(service);
          } catch( ex ) {
            console.debug( "Exception loading authorizations: " + ex );
          }
        }
      }
    });

}


module.exports.start = function() {
  if( !config ) module.exports.loadConfig();

  server = new Hapi.Server(config.server.host, config.server.port, { app : config });

  /* add services to the API */

  this.loadServices( config );

  server.ext('onRequest', function (request, next) {
      console.debug( 'OnRequest' );
      var app = request.server.settings.app;
      if( security.validateHeaders( request ) && request.method === 'post' ) {
        next();
      }
      else {
        next( { "text" : app.messages.request_denied } );
      }
  });

  server.ext('onPreAuth', function (request, next) {
      console.debug( 'onPreAuth' );
      next();

  });

  server.ext('onPostAuth', function (request, next) {
      console.debug( "onPostAuth" );
      next();

  });

  server.ext('onPreHandler', function (request, next) {
      console.debug( "onPostAuth" );
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

  server.ext('onPreResponse', function (request, next) {
      console.debug( "onPreResponse" );
      next();

  });

  server.start(function () {
      console.debug('Slack Command Line Server running at:', server.info.uri);
  });

}


