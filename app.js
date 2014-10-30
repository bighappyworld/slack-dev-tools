var Hapi = require('hapi');
var Joi = require('joi');
var path = require('path');
var config = require('./config.json');
var server = new Hapi.Server(config.host, config.port, { app : config.app});

/* Add the config specified route */
var cli_route = require( config.app.cli_file );
cli_route.path = config.app.cli_path;
addValidation(cli_route);
server.route(cli_route);

/* add any additional routes to the API */
var normalizedPath = path.join(__dirname, "routes");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  var aRoute = require( "./routes/" + file );
  // This is the standard Slack Post, every file should validate this
  addValidation(aRoute);
  server.route(aRoute);
});

function addValidation( route )
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

// Every Request Goes Through Here

server.ext('onRequest', function (request, next) {
    //console.log("onRequest");
    // This ensures we only get posts and all post payloads are validated later in the process

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
/*
server.ext('onPreAuth', function (request, next) {
    // Payload hasn't been parsed
    console.log("onPreAuth");
    next();
});

server.ext('onPostAuth', function (request, next) {
    // Payload is Ready Here
    console.log("onPostAuth");
    // If you add a non-falsy argument to next, it exits the process
    next();
});
*/
server.ext('onPreHandler', function (request, next) {
    //console.log("onPreHandler");
    // The payload has been validated at this point, but the validation doesn't validate specific values. This is the point where we can look for specific users, channels, keywords, etc
    // These are global conditions, like checking for your admin ids

    if( request.server.settings.app.admin_ids.indexOf( request.payload.user_id ) >= 0 )
    {
        next();
    }
    else
    {
        next( { "text" : request.server.settings.app.access_denied } );
    }
});
/*
server.ext('onPostHandler', function (request, next) {
    console.log("onPostHandler");
    next();
});

server.ext('onPreResponse', function (request, next) {
    console.log("onPreResponse");
    next();
});
*/

server.start(function () {
    console.log('Slack Command Line Server running at:', server.info.uri);
});
