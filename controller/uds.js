  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var url = require( 'url' );
var helper = require( '../lib/helper.js' );
var udsModel = require( '../model/uds.js' );
var config = require( '../lib/config.js' );


module.exports = function( api ) {

  api.get( '/uds', function( req, res ) {
    req.requireAuth( ['admin','guest'], ['confirmed','enabled'], function() {

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
        ['user_id','mac','created','last_seen','last_ap_id'];
      q.filter  = req.query.filter ? req.query.filter : {};
      q.include = req.query.include ? req.query.include.split(',') : [];

      // Only admins can request all uds. Otherwise enforce filters
      if( ! adm ) q.filter.user_id = req.auth.id
      
      // Admins can change pagination limit
      if( adm && req.query.limit ) q.limit = req.query.limit;

      // And go ...
      udsModel.find( q, function( err, uds ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Build meta
        ret.meta = helper.paginator( config.base + url.format( {
          pathname: '/uds',
          query: {
            fields: q.fields.join(','),
            sort: q.sort.join(','),
            include: q.include.join(','),
            filter: q.filter
          }
        } ) + "&page=", q.page, uds.limit, uds.count );

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Uds
        ret.uds = uds.data;

        res.endJSON( ret );
      } );
    } );
  } );

  api.post( '/uds', function( req, res ) {
    req.requireAuth( ['admin'], ['confirmed','enabled'], function() {
      // Catch malformed transmitted bodys
      if( ! req.body || ! req.body.uds ) return res.status(400).endJSON( {
        errors: {
          id:    'uds-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Here we go ...
      udsModel.add( req.body.uds, function( err, ud ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return newly created ud
        res
          .status( 201 )
          .location( config.base + "/uds/" + ud.id )
          .endJSON( { uds: ud } );
      } );
    } );
  } );

  api.get( '/uds/:id', function( req, res ) {
    req.requireAuth( ['admin','guest'], ['confirmed','enabled'], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Build request
      var q = {}
      q.fields  = req.query.fields ?
        req.query.fields.split(',') :
        ['user_id','mac','created','last_seen','last_ap_id'];
      q.include = req.query.include ? req.query.include.split(',') : [];

      // Non-admins are restricted to their own uds
      if( ! adm ) q.filter = { user_id: req.auth.id };

      // And go ...
      udsModel.get( req.params.id, q, function( err, ud ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Uds
        ret.uds = ud;

        res.endJSON( ret );
      } );
    } );
  } );

  api.put( '/uds/:id', function( req, res ) {
    req.requireAuth( ['admin'], ['enabled'], function() {
      // Catch malformed transmitted bodys
      if( ! req.body ||
        ! req.body.uds ||
        ! req.body.uds.id ||
        ! req.body.uds.id == req.params.id
      ) return res.status(400).endJSON( {
        errors: {
          id:    'uds-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Prepare changes object and id
      var q = { id: req.params.id };

      // Prepare changes
      var changes = req.body.uds;
      delete changes.id;

      // Go, go, go!
      udsModel.update( q, changes, function( err, ud ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return chnaged object
        res.endJSON( { uds: ud } );
      } );
    } );
  } );

  api.delete( '/uds/:id', function( req, res ) {
    req.requireAuth( ['admin','guest'], ['enabled'], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Only admins can delete arbitrary accounts. Other just their own.
      var q = { id: req.params.id };
      if( ! adm ) q.user_id = req.auth.id;

      udsModel.remove( q, function( err ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // No content, just quit
        res.status( 204 ).end();
      } )
    } );
  } );
}
