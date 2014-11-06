var util = require( './util.js' );


module.exports.validateHeaders = function( request ) {
      var app = request.server.settings.app;
      var validHeaders = true;
      var requiredHeaders = app.server.required_headers;
      for( var i = 0 ; i < requiredHeaders.length ; i++ ) {

          if( requiredHeaders[i].values.indexOf( request.headers[ requiredHeaders[i].key ] ) < 0 ) {
              validHeaders = false;
              break;
          }
      }
      return validHeaders;
};

module.exports.checkPermissions = function( request, auth ) {
    var app = request.server.settings.app;

    if( app.auth.bot.indexOf( request.payload.user_id ) >= 0 ) { return 'ignore'; }
    else if( !auth || !auth.enabled ) { return 'service_disabled'; }
    else if( auth.permissions === 'all' ) { return 'ok'; }
    else if( auth.tokens.indexOf( request.payload.token ) < 0 ) { return 'access_denied'; }
    else {
        var ids = app.auth[ auth.permissions ];
        if( ids && ids.indexOf( request.payload.user_id ) >= 0 ) { return 'ok'; }
        else { return 'access_denied'; }
    }
};

var authorizationTable = {};

module.exports.addAuthorization = function( path, authorization ) {
  var hash = util.hashPath( util.minifiedConfigPath( path ) );
  if( authorizationTable[hash] ) throw new Exception('Path already exists for authorization');
  else authorizationTable[ hash ] = authorization;
}

module.exports.lookupAuthorization = function( path, params ) {
  var hash = util.hashPath( util.minifiedRequestPath( path, params ) );
  if( authorizationTable[hash] ) return authorizationTable[hash];
  else return null;
}

module.exports.clearAuthorizations = function( path, params ) {
  authorizationTable = {};
}

