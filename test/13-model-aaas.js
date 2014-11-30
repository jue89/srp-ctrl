// Requirements
var async = require( 'async' );
var should = require( 'should' );
var aaas = require( '../model/aaas.js' );
var users = require( '../model/users.js' );


describe( 'model/aaas.js', function() {
  before( function( done ) {
    // Create some users and aps
    async.parallel( [
      function( done ) { users.add( {
        id: 'david',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: true, sharer: false, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'gertrude',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, sharer: false, guest: true }
      }, done ); }
    ], done );
  } );

  it( 'should reject creating AAA without public key', function(done) {
    aaas.add( {
      user_id: 'david',
      fqdn: 'aaa.example.com'
    }, function( err, res ) {
      err.code.should.equal(409);
      done();
    } );
  } );

  it( 'should reject creating AAA without FQDN', function(done) {
    aaas.add( {
      user_id: 'david',
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      err.code.should.equal(409);
      done();
    } );
  } );

  it( 'should reject creating AAA without user', function(done) {
    aaas.add( {
      fqdn: 'aaa.example.com',
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      err.code.should.equal(409);
      done();
    } );
  } );

  it( 'should reject creating AAA with non-existent user', function(done) {
    aaas.add( {
      user_id: 'nonexistent',
      fqdn: 'aaa.example.com',
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      err.code.should.equal(404);
      done();
    } );
  } );

  it( 'should reject creating AAA with non-vno user', function(done) {
    aaas.add( {
      user_id: 'gertrude',
      fqdn: 'aaa.example.com',
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      err.code.should.equal(404);
      done();
    } );
  } );

  var id;
  it( 'should create AAA', function(done) {
    aaas.add( {
      user_id: 'david',
      fqdn: 'aaa.example.com',
      public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
    }, function( err, res ) {
      res.user_id.should.equal('david');
      id = res.id;
      done();
    } );
  } );

  it( 'should delete AAA', function(done) {
    aaas.remove( id, done );
  } );

} );
