// Requirements
var async = require( 'async' );
var should = require( 'should' );
var request = require( 'supertest' );
var users = require( '../model/users.js' );
var api = require( '../api.js' );

// Configuration
var config = require( '../lib/config.js');


describe('API - APs', function() {
  before( function( done ) {
    // Create some users
    async.parallel( [
      function( done ) { users.add( {
        id: 'dorian',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, operator: true, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'emma',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, operator: true, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'unconfirmed',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: false, // <--
        roles: { vno: false, operator: true, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'disabled',
        password: 'password',
        email: 'test@example.com',
        enabled: false, // <--
        confirmed: true,
        roles: { vno: false, operator: true, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'god',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: true, operator: false, guest: false } // <--
      }, done ); }
    ], done );
  } );

  it('should deny creating aps for unconfirmed users', function( done ) {
    request(config.base)
      .post('/aps')
      .type('application/vnd.api+json')
      .auth('unconfirmed', 'password')
      .send( JSON.stringify( { users: {
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358' } } ) )
      .expect( 401, done );
  } );


  it('should deny creating aps for disabled users', function( done ) {
    request(config.base)
      .post('/aps')
      .type('application/vnd.api+json')
      .auth('disabled', 'password')
      .send( JSON.stringify( { users: {
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358' } } ) )
      .expect( 401, done );
  } );

  it('should deny creating aps for other users when non-vno', function( done ) {
    request(config.base)
      .post('/aps')
      .type('application/vnd.api+json')
      .auth('dorian', 'password')
      .send( JSON.stringify( { aps: {
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358',
        user_id: 'emma' } } ) )
      .expect( 401, done );
  } );

  it('should deny creating aps for non-existent users', function( done ) {
    request(config.base)
      .post('/aps')
      .type('application/vnd.api+json')
      .auth('god', 'password')
      .send( JSON.stringify( { aps: {
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358',
        user_id: 'notfound' } } ) )
      .expect( 404, done );
  } );

  it('should deny creating ap when invalid key is given', function( done ) {
    request(config.base)
      .post('/aps')
      .type('application/vnd.api+json')
      .auth('dorian', 'password')
      .send( JSON.stringify( { aps: {
        public_key: '1234' } } ) )
      .expect( 409, done );
  } );

  var id, ipv6_id;
  it('should create aps', function( done ) {
    request(config.base)
      .post('/aps')
      .type('application/vnd.api+json')
      .auth('dorian', 'password')
      .send( JSON.stringify( { aps: {
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358' } } ) )
      .expect( 201 )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.aps ) res.body = JSON.parse( res.text );
        var a = res.body.aps;
        a.user_id.should.equal('dorian');
        id = a.id;
        ipv6_id = a.ipv6_id;
        request(config.base)
          .post('/aps')
          .type('application/vnd.api+json')
          .auth('emma', 'password')
          .send( JSON.stringify( { aps: {
            public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358' } } ) )
          .expect( 201 )
          .end( function( err, res ) {
            if( err ) throw err;
            if( ! res.body.aps ) res.body = JSON.parse( res.text );
            var a = res.body.aps;
            a.user_id.should.equal('emma');
            done();
          } );
      } );
  } );

  it('should deny changing ap owner when non-vno', function( done ) {
    request(config.base)
      .put('/aps/' + id)
      .type('application/vnd.api+json')
      .auth('dorian', 'password')
      .send( JSON.stringify( { aps: {
        id: id,
        user_id: 'emma' } } ) )
      .expect( 401, done );
  } );

  it('should deny changing ap owner to non-existent user', function( done ) {
    request(config.base)
      .put('/aps/' + id)
      .type('application/vnd.api+json')
      .auth('god', 'password')
      .send( JSON.stringify( { aps: {
        id: id,
        user_id: 'notfound' } } ) )
      .expect( 404, done );
  } );

  it('should deny changing ap owner to non-operator', function( done ) {
    request(config.base)
      .put('/aps/' + id)
      .type('application/vnd.api+json')
      .auth('god', 'password')
      .send( JSON.stringify( { aps: {
        id: id,
        user_id: 'god' } } ) )
      .expect( 404, done );
  } );

  it('should deny changing foreign ap', function( done ) {
    request(config.base)
      .put('/aps/' + id)
      .type('application/vnd.api+json')
      .auth('emma', 'password')
      .send( JSON.stringify( { aps: {
        id: id,
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358' } } ) )
      .expect( 404, done );
  } );

  it('should just return own aps when non-vno', function( done ) {
    request(config.base)
      .get('/aps')
      .auth('emma', 'password')
      .expect( 200 )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.aps ) res.body = JSON.parse( res.text );
        var a = res.body.aps;
        a.forEach( function(i) {
          i.user_id.should.equal('emma');
        } );
        done();
      } );
  } );

  it('should deny getting a foreign ap', function( done ) {
    request(config.base)
      .get('/aps/' + id)
      .auth('emma', 'password')
      .expect( 404, done )
  } );

  it('should return aps by ipv6_id', function( done ) {
    request(config.base)
      .get('/aps?filter[ipv6_id]=' + ipv6_id)
      .auth('god', 'password')
      .expect( 200 )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.aps ) res.body = JSON.parse( res.text );
        var a = res.body.aps;
        a[0].id.should.equal(id);
        done();
      } );
  } );

  it('should deny deleting foreign ap', function( done ) {
    request(config.base)
      .delete('/aps/' + id)
      .auth('emma', 'password')
      .expect( 404, done );
  } );

  it('should delete own ap', function( done ) {
    request(config.base)
      .delete('/aps/' + id)
      .auth('dorian', 'password')
      .expect( 204, done );
  } );

} );
