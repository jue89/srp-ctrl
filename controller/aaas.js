  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var url = require( 'url' );
var helper = require( '../lib/helper.js' );
var aaasModel = require( '../model/aaas.js' );
var config = require( '../lib/config.js' );


module.exports = function( api ) {

  api.get( '/aaas', function( req, res ) {
    req.requireAuth( ['admin'], ['confirmed','enabled'], function() {

      // Build request
      var q = {}
      q.page    = req.query.page ? parseInt(req.query.page) : 0;
      q.sort    = req.query.sort ? req.query.sort.split(',') : [];
      q.fields  = req.query.fields ?
        req.query.fields.split(',') :
        ['user_id','ipv6_id','created','last_changed','fqdn','public_key'];
      q.filter  = req.query.filter ? req.query.filter : {};
      q.include = req.query.include ? req.query.include.split(',') : [];
      q.limit   = req.query.limit ? req.query.limit : null;

      // And go ...
      aaasModel.find( q, function( err, aaas ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Build meta
        ret.meta = helper.paginator( config.base + url.format( {
          pathname: '/aaas',
          query: {
            fields: q.fields.join(','),
            sort: q.sort.join(','),
            include: q.include.join(','),
            filter: q.filter
          }
        } ) + "&page=", q.page, aaas.limit, aaas.count );

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Aps
        ret.aaas = aaas.data;

        res.endJSON( ret );
      } );
    } );
  } );

  api.post( '/aaas', function( req, res ) {
    req.requireAuth( ['admin'], ['confirmed','enabled'], function() {
      // Catch malformed transmitted bodys
      if( ! req.body || ! req.body.aaas ) return res.status(400).endJSON( {
        errors: {
          id:    'aaas-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      var b = req.body.aaas;
      // Users ID
      if( b.user_id == null ) b.user_id = req.auth.id;

      aaasModel.add( b, function( err, aaa ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return newly created aaa
        res
          .status( 201 )
          .location( config.base + "/aaas/" + aaa.id )
          .endJSON( { aaas: aaa } );
      } );
    } );
  } );

  api.get( '/aaas/:id', function( req, res ) {
    req.requireAuth( ['admin'], ['confirmed','enabled'], function() {

      // Build request
      var q = {}
      q.fields  = req.query.fields ?
        req.query.fields.split(',') :
        ['user_id','ipv6_id','created','last_changed','fqdn','public_key'];
      q.include = req.query.include ? req.query.include.split(',') : [];
      q.filter  = req.query.filter ? req.query.filter : {};

      // And go ...
      aaasModel.get( req.params.id, q, function( err, aaa ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Aaas
        ret.aaas = aaa;

        res.endJSON( ret );
      } );
    } );
  } );

  api.put( '/aaas/:id', function( req, res ) {
    req.requireAuth( ['admin'], ['enabled'], function() {
      // Catch malformed transmitted bodys
      if( ! req.body ||
        ! req.body.aaas ||
        ! req.body.aaas.id ||
        ! req.body.aaas.id == req.params.id
      ) return res.status(400).endJSON( {
        errors: {
          id:    'aaas-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Prepare changes object and id
      var q = { id: req.params.id };

      // Prepare changes
      var changes = req.body.aaas;
      delete changes.id;

      // Go, go, go!
      aaasModel.update( q, changes, function( err, aaa ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Return chnaged object
        res.endJSON( { aaas: aaa } );
      } );
    } );
  } );

  api.delete( '/aaas/:id', function( req, res ) {
    req.requireAuth( ['admin'], ['enabled'], function() {
      var q = { id: req.params.id };

      aaasModel.remove( q, function( err ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // No content, just quit
        res.status( 204 ).end();
      } )
    } );
  } );
}
