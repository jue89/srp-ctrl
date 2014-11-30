// Requirements
var async = require( 'async' );
var should = require( 'should' );
var aps = require( '../model/aps.js' );
var users = require( '../model/users.js' );


describe( 'model/aps.js', function() {
  before( function( done ) {
    // Create some users
    async.parallel( [
      function( done ) { users.add( {
        id: 'apalice',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, sharer: true, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'apbob',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, sharer: true, guest: false }
      }, done ); },
    ], done );
  } );

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
      user_id: 'apbob'
    }, function( err, res ) {
      err.code.should.equal( 409 );
      done();
    } );
  } );

  var id;
  var ipv6_id;
  it( 'should create a new AP', function(done) {
    aps.add( {
      user_id: 'apbob',
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      if( err ) throw err;
      res.should.have.property('id');
      id = res.id;
      res.should.have.property('ipv6_id');
      ipv6_id = res.ipv6_id;
      res.user_id.should.equal('apbob');
      res.public_key.should.equal(
        '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
      );
      done();
    } );
  } );

  it( 'should find AP by IPv6 interface identifier', function(done) {
    aps.find( { filter: { ipv6_id: ipv6_id } }, function( err, res ) {
      if( err ) throw err;
      res.data[0].user_id.should.equal('apbob');
      done();
    } );
  } );

  it( 'should change sharer', function(done) {
    aps.update( id, {
      user_id: 'apalice'
    }, function( err, res ) {
      if( err ) throw err;
      res.user_id.should.equal('apalice');
      done();
    } );
  } );

  it( 'should update public key', function(done) {
    aps.update( id, {
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358'
    }, function( err, res ) {
      if( err ) throw err;
      res.public_key.should.equal('78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358');
      done();
    } );
  } );

  it( 'should remove AP', function(done) {
    aps.remove( id, done );
  } );

} );
