var Hapi = require('hapi');
var Joi = require('joi');
var crypto = require('crypto');

var config;

var service_lookup = {};

module.exports.loadConfig = function( path ) {
    if( path )
    {
        try{
            config = require( path );
        }catch( err )
        {
            console.log( "Error loading config file at: [" + path +"], using default config" );
            config = require('./config.json');
        }
    }
    else
    {
        config = require('./config.json');
    }
};

function minifiedPath( path )
{
  // Going to remove optional arguments from the path
  var components = path.split( '/' ); // we need to remove parameters
  var minifiedPath = "";
  for( var i = 0 ; i < components.length ; i++ )
  {
      var component = components[i];
      if( component.charAt(0) !== '{' && component.charAt(component.length - 1) !== '}' )
      {
          minifiedPath += component;
      }
  }
  return minifiedPath;
}

function extractedPath( path, parameters )
{
  var keys = Object.keys( parameters );
  var minifiedPath = path;
  for( var i = 0 ; i < keys.length ; i++ )
  {
      minifiedPath = minifiedPath.replace(parameters[keys[i]], '');
  }

  minifiedPath = minifiedPath.replace( new RegExp( '/', 'g' ), '' );
  return minifiedPath;
}

function hashPath( path )
{
  return crypto.createHash('md5').update(path).digest('hex');
}

module.exports.start = function(){
  if( !config ) module.exports.loadConfig();

  var server = new Hapi.Server(config.server.host, config.server.port, { app : config });

  /* add services to the API */

  Object.keys(config).forEach(function(key) {
    var service_config = config[key];
    if( service_config.file_path )
    {
      var service = require( service_config.file_path );
      service.path = service_config.post_path;
      server.route(service);

      service_lookup[ hashPath(minifiedPath(service_config.post_path)) ] = {
                                                          "permissions" : service_config.permissions,
                                                          "enabled" : service_config.enabled,
                                                          "token" : service_config.token
                                                        };
    }
  });

  server.ext('onRequest', function (request, next) {
      var app = request.server.settings.app;

      var headers_passed = true;
      var required_headers = app.server.required_headers;
      for( var i = 0 ; i < required_headers.length ; i++ )
      {
          if( request.headers[ required_headers[i].key ] !== required_headers[i].value )
          {
              headers_passed = false;
              break;
          }
      }

      if( headers_passed && request.method === 'post' )
      {
        next();
      }
      else
      {
        next( { "text" : app.messages.request_denied } );
      }
  });

  /*
  server.ext('onPreAuth', function (request, next) {
      next();
  });

  server.ext('onPostAuth', function (request, next) {
      next();
  });
  */

  server.ext('onPreHandler', function (request, next) {
      var app = request.server.settings.app;

      var auth = service_lookup[ hashPath(extractedPath( request.path, request.params ) ) ];

      var bot_ids = app.app.bot_ids;
      if( bot_ids.indexOf( request.payload.user_id ) >= 0 )
      {
          next( { "text" : "" } );
      }
      else if( !auth || !auth.enabled )
      {
          next( { "text" : app.messages.service_disabled } );
      }
      else if( auth.permissions === 'all' )
      {
          next();
      }
      else if( auth.token !== request.payload.token )
      {
          next( { "text" : app.messages.access_denied } );
      }
      else
      {
          if( auth.permissions === 'admin' )
          {
              var ids = app.app.admin_ids;
              if( ids.indexOf( request.payload.user_id ) >= 0 )
              {
                  next();
              }
              else
              {
                  next( { "text" : app.messages.access_denied } );
              }
          }
          else if( auth.permissions === 'team' )
          {
              var ids = app.app.team_ids;
              if( ids.indexOf( request.payload.team_id ) >= 0 )
              {
                  next();
              }
              else
              {
                  next( { "text" : app.messages.access_denied } );
              }
          }
          else
          {
              next( { "text" : app.messages.access_denied } );
          }
      }

  });

  server.start(function () {
      console.log('Slack Command Line Server running at:', server.info.uri);
  });

}


