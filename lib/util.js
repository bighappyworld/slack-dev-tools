var crypto = require('crypto');

/* This takes the specified path from the config and removes the parameters
   to create a hashable, replicatable path for lookups
*/
module.exports.minifiedConfigPath = function ( path ) {
  // Going to remove optional arguments from the path
  var components = path.split( '/' ); // we need to remove parameters
  var minPath = "";
  for( var i = 0 ; i < components.length ; i++ ) {
      var component = components[i];
      if( component.charAt(0) !== '{' && component.charAt(component.length - 1) !== '}' ) {
          minPath += component;
      }
  }
  return minPath;
};

/* This takes the path from the request and removes the parameters,
   to create a hashable, replicatable path for lookups
*/
module.exports.minifiedRequestPath = function ( path, parameters ) {
  var minPath = path;
  if( parameters ) {
    var keys = Object.keys( parameters );
    for( var i = 0 ; i < keys.length ; i++ ) {
        minPath = minPath.replace(parameters[keys[i]], '');
    }
  }
  minPath = minPath.replace( new RegExp( '/', 'g' ), '' );
  return minPath;
}

module.exports.hashPath = function ( path ) {
  return crypto.createHash('md5').update(path).digest('hex');
}
