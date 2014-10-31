var Hapi = require('hapi');
var Joi = require('joi');

var config;

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

function addRouteValidation( route )
{
    if( !route.config ) route.config = {};
    if( !route.config.validate ) route.config.validate = {};
    if( !route.config.validate.payload ) route.config.validate.payload = {};
    route.config.validate.payload = {
        token: Joi.string().token().required(),
        team_id: Joi.string().token().required(),
        team_domain: Joi.string().required(),
        service_id: Joi.string().token().required(),
        channel_id: Joi.string().token().required(),
        channel_name: Joi.string().required(),
        timestamp: Joi.string().required(),
        user_id: Joi.string().required(),
        user_name: Joi.string().required(),
        text: Joi.string().required(),
        trigger_word: Joi.string().required()
    };
}

module.exports.start = function(){
  if( !config ) module.exports.loadConfig();

  var server = new Hapi.Server(config.host, config.port, { app : config.app});

  /* Add the config specified route */
  var cli_route = require( config.app.cli_file );
  cli_route.path = config.app.cli_path;
  addRouteValidation(cli_route);
  server.route(cli_route);

  /* add any additional routes to the API */
  var path = require('path');
  var normalizedPath = path.join(__dirname, "routes");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
      if( path.extname(file) === '.js' )
      {
          var aRoute
          try{
            var aRoute = require( "./routes/" + file );
            addRouteValidation(aRoute);
            server.route(aRoute);
          } catch( err )
          {
            console.log( "Error loading route: + " + file );
          }
      }
  });

  server.ext('onRequest', function (request, next) {

      var headers_passed = true;
      var required_headers = request.server.settings.app.required_headers;
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
        next( { "text" : request.server.settings.app.request_denied } );
      }
  });

  server.ext('onPreHandler', function (request, next) {
      var admin_ids = request.server.settings.app.admin_ids;
      if( admin_ids.length === 0 )
      {
          next();
      }
      else if( request.server.settings.app.admin_ids.indexOf( request.payload.user_id ) >= 0 )
      {
          next();
      }
      else
      {
          next( { "text" : request.server.settings.app.access_denied } );
      }
  });

  server.start(function () {
      console.log('Slack Command Line Server running at:', server.info.uri);
  });

}


