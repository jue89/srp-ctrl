// Requirements
var users = require( '../model/users.js' );
var libPassword = require( '../lib/password.js' );

module.exports = function( api ) {

  api.use( function( req, res, next ) {

    // Analyses given auth header. Checks against users model.
    req.getAuth = function( callback ) {
      // Has been evaluated in the past
      if( this.auth ) return callback( this.auth );

      // Default: Not authenticated
      this.auth = {
        id: null,
        roles: { admin: false, guest: false, operator: false },
        flags: { confirmed: false, enabled: false }
      };

      // No auth header given
      if( ! this.headers.authorization ) return callback( this.auth );

      // PROCESS AUTHORISATION
      var authHeader = this.headers.authorization.split(' ');

      // Just allow BASIC auth
      if( authHeader[ 0 ] != "Basic" ) return callback( this.auth );

      // Get credentials
      var cred = new Buffer( authHeader[ 1 ], 'base64' ).toString();
      var index = cred.indexOf( ':' );
      var user = cred.slice( 0, index );
      var password = cred.slice( index + 1 );

      // Find user
      var self = this;
      users.get(
        user,
        { fields: [ 'password', 'roles', 'confirmed', 'enabled' ] },
        function( err, user ) {
          // User not found or password wrong
          if(
            err ||
            ! libPassword.check( password, user.password )
          ) return callback( self.auth );

          // Save user into request
          self.auth = {
            id: user.id,
            roles: user.roles,
            flags: { confirmed: user.confirmed, enabled: user.enabled }
          }

          // Callback
          callback( self.auth );
        }
      );

    }

    // Requires at least one of the given roles. Otherwise request from user.
    req.requireAuth = function( roles, flags, callback ) {
      // When roles / flags is a string -> convert to array
      if( typeof roles == "string" ) roles = [ roles ];
      if( typeof flags == "string" ) flags = [ flags ];


      // Anonymous is okay
      if( roles.length == 0 && flags.length == 0 ) return callback();

      var self = this;
      this.getAuth( function( auth ) {
        var authorised = false;

        // User is logged on
        if( auth.id ) {
          // Check if one required role is given
          roles.forEach( function( item ) {
            // Required role given --> Authorised!
            if( auth.roles[ item ] ) authorised = true;
          } );

          // Check if all required flags are given
          flags.forEach( function( item ) {
            // Required flag not given --> Not authorised!
            if( ! auth.flags[ item ] ) authorised = false;
          } );
        }

        // Send back authorisation request, when not authorised. Otherwise: Callback
        if( ! authorised ) return self.res.endAuth();

        callback();
      } );
    }

    // Helper to send authentication request
    res.endAuth = function() {
      this.statusCode = 401;
      this.setHeader('WWW-Authenticate', 'Basic realm="Authorisation Required"');
      this.endJSON( {
        id:    'access-denied',
        code:  401,
        title: "Unathorised."
      } );
    }

    next();

  } );

}
