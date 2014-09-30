// Requirements
var should = require( 'should' );
var aps = require( '../model/aps.js' );

// Configuration
var config = require( '../lib/config.js');

describe( 'model/aps.js', function() {
  it( 'should reject creating a new AP when no user is stated.', function(done) {
    aps.add( {
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      err.code.should.equal( 409 );
      done();
    } );
  } );

  it( 'should reject creating a new AP when no key is stated.', function(done) {
    aps.add( {
      user_id: 'bob'
    }, function( err, res ) {
      err.code.should.equal( 409 );
      done();
    } );
  } );

  var id;
  var ipv6_id;
  it( 'should add a new AP for user \'bob\'', function(done) {
    aps.add( {
      user_id: 'bob',
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      if( err ) throw err;
      res.should.have.property('id');
      id = res.id;
      res.should.have.property('ipv6_id');
      ipv6_id = res.ipv6_id;
      res.user_id.should.equal('bob');
      res.public_key.should.equal(
        '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
      );
      done();
    } );
  } );

  it( 'should find AP by IPv6 interface identifier', function(done) {
    aps.find( { filter: { ipv6_id: ipv6_id } }, function( err, res ) {
      if( err ) throw err;
      res.data[0].user_id.should.equal('bob');
      done();
    } );
  } );

  it( 'should update user ID', function(done) {
    aps.update( id, {
      user_id: 'alice'
    }, function( err, res ) {
      if( err ) throw err;
      res.user_id.should.equal('alice');
      done();
    } );
  } );

  it( 'should remove AP', function(done) {
    aps.remove( id, done );
  } );

} );
