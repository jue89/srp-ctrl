// Requirements
var crypto = require( 'crypto' );

function LibPassword() {}
LibPassword.prototype = {
  // Salt and hash a given password.
  salt: function( password, salt ) {
    var hash = crypto.createHash('sha1');
    hash.update( password );
    hash.update( salt );
    hash = hash.digest();

    salt = new Buffer( salt );

    return Buffer.concat( [ hash, salt ] ).toString( 'base64' );
  },

  // Generate salt and hash password.
  gen: function( password, callback ) {
    var self = this;
    crypto.randomBytes( 16, function( err, salt ) {
      if( err ) return callback(err);
      callback( null, self.salt( password, salt ) );
    } );
  },

  // Check given password against SSHA1 hash
  check: function( password, ssha ) {
    // Decode SSHA1 hash
    ssha = new Buffer( ssha, 'base64' );

    // Get SHA1 hash
    var sha = ssha.slice( 0, 20 );

    // Get salt
    var salt = ssha.slice( 20 );

    // Hash given password with salt
    var hash = crypto.createHash('sha1');
    hash.update( password );
    hash.update( salt );
    hash = hash.digest();

    // Compare
    return hash.equals( sha );
  }
}

module.exports = new LibPassword();
