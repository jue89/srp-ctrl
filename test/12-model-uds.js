// Requirements
var async = require( 'async' );
var should = require( 'should' );
var uds = require( '../model/uds.js' );
var aps = require( '../model/aps.js' );
var users = require( '../model/users.js' );


describe( 'model/uds.js', function() {
  var id;
  before( function( done ) {
    // Create some users and aps
    async.parallel( [
      function( done ) { users.add( {
        id: 'udalice',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, sharer: true, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'udbob',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, sharer: false, guest: true }
      }, done ); }
    ], function( err, res ) {
      aps.add( {
        user_id: 'udalice',
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
      }, function( err, res ) {
        id = res.id;
        done();
      } );
    } );
  } );

  it( 'should reject creating UD without AP', function(done) {
    uds.add( {
      user_id: 'udbob',
      mac: '00:11:22:33:44:55'
    }, function( err, res ) {
      err.code.should.equal(409);
      done();
    } );
  } );

  it( 'should reject creating UD without MAC', function(done) {
    uds.add( {
      user_id: 'udbob',
      last_ap_id: id
    }, function( err, res ) {
      err.code.should.equal(409);
      done();
    } );
  } );

  it( 'should reject creating UD without user', function(done) {
    uds.add( {
      mac: '00:11:22:33:44:55',
      last_ap_id: id
    }, function( err, res ) {
      err.code.should.equal(409);
      done();
    } );
  } );

  it( 'should reject creating UD with non-existent user', function(done) {
    uds.add( {
      user_id: 'nonexistent',
      mac: '00:11:22:33:44:55',
      last_ap_id: id
    }, function( err, res ) {
      err.code.should.equal(404);
      done();
    } );
  } );

  it( 'should reject creating UD with non-guest user', function(done) {
    uds.add( {
      user_id: 'udalice',
      mac: '00:11:22:33:44:55',
      last_ap_id: id
    }, function( err, res ) {
      err.code.should.equal(404);
      done();
    } );
  } );

  var id_ud;
  it( 'should create UD', function(done) {
    uds.add( {
      user_id: 'udbob',
      mac: '00:11:22:33:44:55',
      last_ap_id: id
    }, function( err, res ) {
      res.user_id.should.equal('udbob');
      id_ud = res.id;
      done();
    } );
  } );

  it( 'should update last visited AP', function(done) {
    uds.update( id_ud, {
      last_ap_id: id
    }, function( err, res ) {
      res.last_ap_id.should.equal(id);
      done();
    } );
  } );

  it( 'should delete UD', function(done) {
    uds.remove( id_ud, done );
  } );

} );
