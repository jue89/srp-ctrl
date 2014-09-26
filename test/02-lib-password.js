// Requirements
var pw = require( '../lib/password.js' );

describe( 'lib/password.js', function() {
  it( 'should hash password \'passme\' with salt \'salt\'', function(done) {
    if( pw.salt( 'passme', 'salt' ) == 'bXUygZ+GToKwJysZyzghIEwf9tJzYWx0' ) return done();
    throw new Error();
  } );
  it( 'should hash password \'passme\' with random salt', function(done) {
    pw.gen( 'passme', done );
  } );
  it( 'should check correct password \'passme\'', function(done) {
    if( pw.check( 'passme', 'bXUygZ+GToKwJysZyzghIEwf9tJzYWx0' ) ) return done();
    throw new Error();
  } );
  it( 'should check wrong password \'wr0ng\'', function(done) {
    if( ! pw.check( 'wr0ng', 'bXUygZ+GToKwJysZyzghIEwf9tJzYWx0' ) ) return done();
    throw new Error();
  } );
} );
