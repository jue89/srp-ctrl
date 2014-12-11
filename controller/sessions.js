  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var url = require( 'url' );
var async = require( 'async' );
var helper = require( '../lib/helper.js' );
var apsModel = require( '../model/aps.js' );
var udsModel = require( '../model/uds.js' );
var sessionsModel = require( '../model/sessions.js' );
var config = require( '../lib/config.js' );


module.exports = function( api ) {

  api.get( '/sessions', function( req, res ) {
    req.requireAuth( ['vno','sharer','guest'], ['confirmed','enabled'], function() {

      // Current user is VNO?
      var vno = req.auth.roles.vno
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Build request
      var q = {}
      q.page    = req.query.page ? parseInt(req.query.page) : 0;
      q.sort    = req.query.sort ? req.query.sort.split(',') : [];
      q.fields  = req.query.fields ?
        req.query.fields.split(',') : [
          'ap_id','ud_id',
          'ended','begin','last_seen',
          'sent_bytes','received_bytes'
        ];
      q.filter  = req.query.filter ? req.query.filter : {};
      q.include = req.query.include ? req.query.include.split(',') : [];

      // Change pagination limit
      if( req.query.limit ) q.limit = req.query.limit;

      // Require filter by ap_id or ud_id when non-vno
      if( ! vno && ( ! q.filter.ap_id && ! q.filter.ud_id ) ) res.endAuth();

      // Check ap_id and user + Check ud_id and user --> fetch session
      async.waterfall( [
        function( done ) {
          // Check if stated ap belongs to user
          if( ! vno && q.filter.ap_id ) apsModel.get(
            q.filter.ap_id,
            { filter: { user_id: req.auth.id } },
            done
          )
          else done( null, true );
        },
        function( ap, done ) {
          // Check if stated ud belongs to user
          if( ! vno && q.filter.ud_id ) udsModel.get(
            q.filter.ud_id,
            { filter: { user_id: req.auth.id } },
            done
          )
          else done( null, true );
        },
        function( ud, done ) {
          // Query sessions
          sessionsModel.find( q, done );
        }
      ], function( err, sessions ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Build meta
        ret.meta = helper.paginator( config.base + url.format( {
          pathname: '/sessions',
          query: {
            fields: q.fields.join(','),
            sort: q.sort.join(','),
            include: q.include.join(','),
            filter: q.filter
          }
        } ) + "&page=", q.page, sessions.limit, sessions.count );

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Aps
        ret.sessions = sessions.data;

        res.endJSON( ret );
      } );
    } );
  } );

  api.post( '/sessions', function( req, res ) {
    req.requireAuth( ['vno'], ['confirmed','enabled'], function() {
      // Catch malformed transmitted bodys
      if( ! req.body || ! req.body.sessions ) return res.status(400).endJSON( {
        errors: {
          id:    'sessions-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Body
      var b = req.body.sessions;

      async.waterfall( [
        function( done ) {
          // When ud_mac is stated, resolv it to ud_id
          if( b.ud_mac && b.ud_user_id ) {
            udsModel.find( {
              filter: { mac: b.ud_mac, user_id: b.ud_user_id }
            }, function( err, ud ) {
              // Fetch errors or when no ud is found
              if( err ) return done( err );
              if( ud.count != 1 ) return done( {
                id:    'sessions-ud-not-found',
                code:  404,
                title: "UD not found."
              } )

              b.ud_id = ud.data[0].id;
              delete b.ud_mac;
              delete b.ud_user_id;
              done();
            } );
          } else {
            done();
          }
        },
        function( done ) {
          // Add sessions
          sessionsModel.add( b, done );
        }
      ], function( err, sessions ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return newly created sessions
        res
          .status( 201 )
          .location( config.base + "/sessions/" + sessions.id )
          .endJSON( { sessions: sessions } );
      } );
    } );
  } );

  api.get( '/sessions/:id', function( req, res ) {
    req.requireAuth( ['vno','sharer','guest'], ['confirmed','enabled'], function() {

      // Current user is VNO?
      var vno = req.auth.roles.vno
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Build request
      var q = {}
      q.fields  = req.query.fields ?
        req.query.fields.split(',') : [
          'ap_id','ud_id',
          'ended','begin','last_seen',
          'sent_bytes','received_bytes'
        ];
      q.include = req.query.include ? req.query.include.split(',') : [];
      q.filter  = req.query.filter ? req.query.filter : {};

      // And go ...
      sessionsModel.get( req.params.id, q, function( err, session ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Sessions
        ret.sessions = session;

        // VNOs are allowed to see every session
        if( vno ) return res.endJSON( ret );

        // Others must be involved in a session (guest or sharer)
        var permited = false;
        async.parallel( [
          function( done ) { apsModel.get(
            session.ap_id,
            { filter: { user_id: req.auth.id } },
            function( err ) { if( ! err ) permited = true; done(); }
          ) },
          function( done ) { udsModel.get(
            session.ud_id,
            { filter: { user_id: req.auth.id } },
            function( err ) { if( ! err ) permited = true; done(); }
          ) }
        ], function() {
          // When not permitted ask for other credentials
          if( ! permited ) return res.endAuth();

          // Otherwise --> send session
          res.endJSON( ret );
        } );
      } );
    } );
  } );

  api.put( '/sessions/:id', function( req, res ) {
    req.requireAuth( ['vno'], ['enabled'], function() {
      // Catch malformed transmitted bodys
      if( ! req.body ||
        ! req.body.sessions ||
        ! req.body.sessions.id ||
        ! req.body.sessions.id == req.params.id
      ) return res.status(400).endJSON( {
        errors: {
          id:    'sessions-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Prepare changes object and id
      var q = { id: req.params.id };

      // Prepare changes
      var changes = req.body.sessions;
      delete changes.id;

      // Go, go, go!
      sessionsModel.update( q, changes, function( err, session ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return chnaged object
        res.endJSON( { sessions: session } );
      } );
    } );
  } );

}
