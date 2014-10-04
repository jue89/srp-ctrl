// Requirements
var pw = require( '../lib/password.js' );

describe( 'lib/password.js', function() {
  var hash;
  it( 'should hash password \'passme\'', function(done) {
    pw.gen( 'passme', function( err, res ) {
      if( err ) throw new Error();
      hash = res;
      done();
    } );
  } );
  it( 'should check correct password \'passme\'', function(done) {
    if( pw.check( 'passme', hash ) ) return done();
    throw new Error();
  } );
  it( 'should check wrong password \'wr0ng\'', function(done) {
    if( ! pw.check( 'wr0ng', hash ) ) return done();
    throw new Error();
  } );
} );
