// Requirements
var crypto = require( 'crypto' );
var ntlm = require( 'smbhash' ).nthash;

function LibPassword() {}
LibPassword.prototype = {
  // Generate password hash
  gen: function( password, callback ) {
    callback( null, ntlm( password ) );
  },

  // Check given password against hash
  check: function( password, hash ) {
    return hash == ntlm( password );
  }
}

module.exports = new LibPassword();
