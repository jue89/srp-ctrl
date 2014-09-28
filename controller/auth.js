// Requirements
var users = require( '../model/users.js' );
var libPassword = require( '../lib/password.js' );

module.exports = function( express ) {
  // Analyses given auth header. Checks against users model.
  express.request.getAuth = function( callback ) {
    // Has been evaluated in the past
    if( this.auth ) return callback( this.auth );

    // No auth header given
    if( ! this.headers.authorization ) return callback( null );

    // PROCESS AUTHORISATION
    var authHeader = this.headers.authorization.split(' ');

    // Just allow BASIC auth
    if( authHeader[ 0 ] != "Basic" ) return callback( null );

    // Get credentials
    var cred = new Buffer( authHeader[ 1 ], 'base64' ).toString();
    var index = cred.indexOf( ':' );
    var user = cred.slice( 0, index );
    var password = cred.slice( index + 1 );

    // Find user
    var self = this;
    users.get( user, { fields: [ 'password', 'roles' ] }, function( err, user ) {
      // User not found
      if( err ) return callback( null );

      // Password wrong
      if( ! libPassword.check( password, user.password ) ) return callback( null );

      // Save user into request
      self.auth = {
        id: user.id,
        roles: user.roles
      }

      // Callback
      callback( self.auth );
    } )

  }

  // Requires at least one of the given roles. Otherwise request from user.
  express.request.requireAuth = function( roles, callback ) {
    // When roles is a string -> convert to array
    if( typeof roles == "string" ) roles = [ roles ];

    // Anonymous is okay
    if( roles.length == 0 ) return callback();

    var self = this;
    this.getAuth( function( auth ) {
      var authorised = false;

      if( auth ) {
        // Check if one required role is given
        roles.forEach( function( item ) {
          // Required rolet given --> Authorised!
          if( auth.roles[ item ] ) authorised = true;
        } );
      }

      // Send back authorisation request, when not authorised. Otherwise: Callback
      if( ! authorised ) {
        self.res.statusCode = 401;
        self.res.setHeader('WWW-Authenticate', 'Basic realm="Authorisation Required"');
        self.res.end('Unauthorized');
      } else {
        callback();
      }
    } );
  }

}
