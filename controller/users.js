  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var url = require( 'url' );
var async = require( 'async' );
var helper = require( '../lib/helper.js' );
var usersModel = require( '../model/users.js' );
var mail = require( '../lib/mail.js' );
var config = require( '../lib/config.js' );


module.exports = function( api ) {

  api.get( '/users', function( req, res ) {

    // User must be administrator
    req.requireAuth( 'admin', ['confirmed','enabled'], function() {

      // Build request
      var q = {}
      q.page    = req.query.page ? parseInt(req.query.page) : 0;
      q.sort    = req.query.sort ? req.query.sort.split(',') : [];
      q.fields  = req.query.fields ?
        req.query.fields.split(',') :
        ['enabled','confirmed','email','roles','created','last_changed'];
      q.filter  = req.query.filter ? req.query.filter : {};
      q.include = req.query.include ? req.query.include.split(',') : [];

      // And go ...
      usersModel.find( q, function( err, users ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Build meta
        ret.meta = helper.paginator( config.base + url.format( {
          pathname: '/users',
          query: {
            fields: q.fields.join(','),
            sort: q.sort.join(','),
            include: q.include.join(','),
            filter: q.filter
          }
        } ) + "&page=", q.page, users.limit, users.count );

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Users
        ret.users = users.data;

        res.endJSON( ret );
      } );
    } );
  } );

  api.post( '/users', function( req, res ) {
    // Catch malformed transmitted bodys
    if( ! req.body || ! req.body.users ) return res.status(400).endJSON( {
      errors: {
        id:    'users-add-malformed',
        code:  400,
        title: "Malformed or missing body. Maybe wrong Content-Type?"
      }
    } );

    req.getAuth( function( auth ) {

      // When no administrator, set or overwrite some fields
      var b = req.body.users;
      var adm = auth.roles.admin && auth.flags.confirmed && auth.flags.enabled;
      if( ! adm || b.enabled == null ) b.enabled = true;
      if( ! adm || b.confirmed == null ) b.confirmed = false;
      if( ! adm || b.roles == null ) b.roles = config.defaultRoles;

      // Create new user
      usersModel.add( b, function( err, user ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Send mail when activated
        if( ! user.confirmed && config.mail.sendMails ) {
          mail.sendMail( {
            from: config.mail.sender,
            to: user.email,
            subject: "Welcome to 13pm.eu!",
            text: "Hello " + user.id + "!\n\n"
              + "Welcome to 13pm.eu!\n"
              + "Your confirmation key is: " + user.confirmation_key + "\n\n"
              + "Have a nice day and have fun on the Internet!"
          } );
        }

        // Hide some fields
        if( ! adm && user.confirmation_key ) delete user.confirmation_key;
        if( ! adm ) delete user.password;

        // Return newly created user
        res
          .status( 201 )
          .location( config.base + "/users/" + user.id )
          .endJSON( { users: user } );
      } );

    } );
  } );

  api.get( '/users/:id', function( req, res ) {
    req.requireAuth( ['admin','operator','guest'], [], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Only admins can watch arbitrary accounts. Other just their own.
      if( ! adm && req.params.id != req.auth.id ) {
        return res.endAuth();
      }

      // Build request
      var q = {}
      q.fields  = req.query.fields ?
        req.query.fields.split(',') :
        ['enabled','confirmed','email','roles','created','last_changed'];
      q.include = req.query.include ? req.query.include.split(',') : [];

      // Only admins can request password and confirmation_key field
      if( ! adm && (
        q.fields.indexOf( 'password' ) != -1 ||
        q.fields.indexOf( 'confirmation_key' ) != -1
      ) ) return res.endAuth();

      // And go ...
      usersModel.get( req.params.id, q, function( err, user ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Prepare answer
        var ret = {};

        // Includes
        if( q.include.length ) {
          // TODO: When other models are available ...
        }

        // TODO: Links

        // Users
        ret.users = user;

        res.endJSON( ret );
      } )

    } );
  } );

  api.put( '/users/:id', function( req, res ) {
    req.requireAuth( ['admin','operator','guest'], ['enabled'], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Only admins can modify arbitrary accounts. Other just their own.
      if( ! adm && req.params.id != req.auth.id ) {
        return res.endAuth();
      }

      // Catch malformed transmitted bodys
      if( ! req.body ||
        ! req.body.users ||
        ! req.body.users.id ||
        ! req.body.users.id == req.params.id
      ) return res.status(400).endJSON( {
        errors: {
          id:    'users-add-malformed',
          code:  400,
          title: "Malformed or missing body. Maybe wrong Content-Type?"
        }
      } );

      // Prepare changes object and id
      var id = req.params.id;
      var changes = req.body.users;
      delete changes.id;

      async.waterfall( [
        function( cb ) {
          // Prevent some fields from modification by non-admins
          if( ! adm ) {
            if( changes.roles != null ) delete changes.roles;
            if( changes.enabled != null ) delete changes.enabled;
            if( changes.confirmed == true ) {
              usersModel.get( id, {fields:['confirmation_key']}, cb )
            } else {
              // When confirmed ist unchanged, skip confirmation_key fetch
              cb( null, true );
            }
          } else {
            // When admin --> bypass
            cb( null, true );
          }
        },
        function( user, cb ) {
          // When upper function hasn't confirmed, check stated confirmation_key
          if(
            user !== true &&
            user.confirmation_key != req.query.confirmation_key
          ) return res.status(400).endJSON( {
            errors: {
              id:    'users-update-wrong-confirmation_key',
              code:  400,
              title: "Stated confirmation_key is wrong."
            }
          } );

          // Change user
          usersModel.update( id, changes, cb );
        }
      ], function( err, user ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // Hide some fields
        if( ! adm && user.confirmation_key ) delete user.confirmation_key;
        if( ! adm ) delete user.password;

        res.endJSON( { users: user } );
      } );
    } );
  } );

  api.delete( '/users/:id', function( req, res ) {
    req.requireAuth( ['admin','operator','guest'], ['enabled'], function() {
      // Current user is admin?
      var adm = req.auth.roles.admin
        && req.auth.flags.confirmed
        && req.auth.flags.enabled;

      // Only admins can delete arbitrary accounts. Other just their own.
      if( ! adm && req.params.id != req.auth.id ) {
        return res.endAuth();
      }

      usersModel.remove( req.params.id, function( err ) {
        // Error has occured
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        // No content, just quit
        res.status( 204 ).end();
      } )
    } );
  } );
}
