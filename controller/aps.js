  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var url = require( 'url' );
var helper = require( '../lib/helper.js' );
var apsModel = require( '../model/aps.js' );
var config = require( '../lib/config.js' );


module.exports = function( api ) {

  api.get( '/aps', function( req, res ) {
    req.requireAuth( ['admin','operator'], ['confirmed','enabled'], function() {

      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Build request
      var q = {}
      q.page    = req.query.page ? parseInt(req.query.page) : 0;
      q.sort    = req.query.sort ? req.query.sort.split(',') : [];
      q.fields  = req.query.fields ?
        req.query.fields.split(',') :
        ['user_id','ipv6_id','created','last_seen','public_key'];
      q.filter  = req.query.filter ? req.query.filter : {};
      q.include = req.query.include ? req.query.include.split(',') : [];

      // Only admins can request all aps. Otherwise enforce filters
      if( ! adm ) q.filter.user_id = req.auth.id

      // Admins can change pagination limit
      if( adm && req.query.limit ) q.limit = req.query.limit;

      // And go ...
      apsModel.find( q, function( err, aps ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Build meta
        ret.meta = helper.paginator( config.base + url.format( {
          pathname: '/aps',
          query: {
            fields: q.fields.join(','),
            sort: q.sort.join(','),
            include: q.include.join(','),
            filter: q.filter
          }
        } ) + "&page=", q.page, aps.limit, aps.count );

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Aps
        ret.aps = aps.data;

        res.endJSON( ret );
      } );
    } );
  } );

  api.post( '/aps', function( req, res ) {
    req.requireAuth( ['admin','operator'], ['confirmed','enabled'], function() {
      // Catch malformed transmitted bodys
      if( ! req.body || ! req.body.aps ) return res.status(400).endJSON( {
        errors: {
          id:    'aps-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Users ID
      var b = req.body.aps;
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;
      if( b.user_id == null ) b.user_id = req.auth.id;
      // When not admin reject creating APs for others
      if( ! adm && b.user_id != req.auth.id ) return res.endAuth();

      apsModel.add( b, function( err, ap ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return newly created ap
        res
          .status( 201 )
          .location( config.base + "/aps/" + ap.id )
          .endJSON( { aps: ap } );
      } );
    } );
  } );

  api.get( '/aps/:id', function( req, res ) {
    req.requireAuth( ['admin','operator'], ['confirmed','enabled'], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Build request
      var q = {}
      q.fields  = req.query.fields ?
        req.query.fields.split(',') :
        ['user_id','ipv6_id','created','last_seen','public_key'];
      q.include = req.query.include ? req.query.include.split(',') : [];

      // Non-admins are restricted to their own aps
      if( ! adm ) q.filter = { user_id: req.auth.id };

      // And go ...
      apsModel.get( req.params.id, q, function( err, ap ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Aps
        ret.aps = ap;

        res.endJSON( ret );
      } );
    } );
  } );

  api.put( '/aps/:id', function( req, res ) {
    req.requireAuth( ['admin','operator'], ['enabled'], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Catch malformed transmitted bodys
      if( ! req.body ||
        ! req.body.aps ||
        ! req.body.aps.id ||
        ! req.body.aps.id == req.params.id
      ) return res.status(400).endJSON( {
        errors: {
          id:    'aps-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Prepare changes object and id
      var q = { id: req.params.id };
      // Non-admins can just update their own aps
      if( ! adm ) q.user_id = req.auth.id;

      // Prepare changes
      var changes = req.body.aps;
      delete changes.id;

      // When not admin reject changing AP owner
      if(
        ! adm &&
        changes.user_id &&
        changes.user_id != req.auth.id
      ) return res.endAuth();

      // Go, go, go!
      apsModel.update( q, changes, function( err, ap ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return chnaged object
        res.endJSON( { aps: ap } );
      } );
    } );
  } );

  api.delete( '/aps/:id', function( req, res ) {
    req.requireAuth( ['admin','operator'], ['enabled'], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Only admins can delete arbitrary accounts. Other just their own.
      var q = { id: req.params.id };
      if( ! adm ) q.user_id = req.auth.id;

      apsModel.remove( q, function( err ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // No content, just quit
        res.status( 204 ).end();
      } )
    } );
  } );
}
