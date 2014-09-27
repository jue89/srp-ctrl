  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var async = require( 'async' );
var util = require( 'util' );
var EventEmitter = require( 'events' ).EventEmitter;
var crypto = require( 'crypto' );
var validate = require( 'json-schema' );
var config = require( '../lib/config.js' );
var mongo = require( '../lib/db.js' );
var password = require( '../lib/password.js' );



  ////////////////////////
 // CONSTRUCTOR        //
////////////////////////

function ModelUsers() {

  // Connect to collection
  this.db = null;
  var self = this;
  mongo( "users", [], function( db ){
    // Connected: Save instance and emit event
    self.db = db;
    self.emit( 'ready' );
  } );

  // Load schemas
  this.schema = {
    add: require( './users.add.json' ),
    update: require( './users.update.json' )
  }
  this.schemaError = {
    add: require( './users.add.js' ),
    update: require( './users.update.js' )
  }

}



  ////////////////////////
 // EVENT EMITTER      //
////////////////////////

util.inherits( ModelUsers, EventEmitter );



  ////////////////////////
 // PROTOTYPES         //
////////////////////////

// PRIVATE FUNC: Helper funtion that checks all preconditions.
ModelUsers.prototype._checkPreconditions = function( callback ) {
  // Connection to users collection must be established
  if( ! this.db ) {
    // Call callback function
    callback( {
      id:    'users-no-database-connection',
      code:  500,
      title: "Connection to database is not available. Please try again later."
    } );

    // Return false: Conditions not met
    return false;
  }

  // Return: Everything is fine :)
  return true;
},


// FUNC: Get user by id
// obj: {
//        fields: [ field1, field2, ... ]
//      }
ModelUsers.prototype.get = function( id, obj, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;


  // PREPARE ALL DATA

  // Create fields object
  var fields = {};
  if( obj.fields ) obj.fields.forEach( function( item ) {
    fields[ item ] = 1;
  } );

  // Query options
  var opts = {
    fields: fields
  };

  // REQUEST OBJECT FROM DATABASE
  var self = this;
  this.db.findOne( { _id: id }, opts, function( err, res ) {
    if( err ) return callback( {
      id:    'users-db-error',
      code:  500,
      title: err
    } );

    // Object not found
    if( ! res ) return callback( {
      id:    'users-not-found',
      code:  404,
      title: "User not found"
    } );

    // Rename id
    res.id = res._id;
    delete res._id;

    // Emit event
    self.emit( 'get', res );

    // Callback
    callback( null, res );
  } );
},

// FUNC: Find users
// obj: {
//        page: (int),
//        filter: { field1: (STR), field2: (STR) },
//        fields: [ field1, field2, ... ],
//        sort: [ -field1, field2, ... ]
//      }
ModelUsers.prototype.find = function( obj, callback ) {
  // Check preconditions
  if( ! this._checkPreconditions( callback ) ) return;

  // Parse obj:

  //// Make sure page is given and integer
  var page = obj.page ? parseInt( obj.page ) : 0;

  //// Build sort array according mongodb documentation
  var sort = [];
  if( obj.sort ) obj.sort.forEach( function( item ) {
    // Default: Ascending
    var dir = 1;
    // When first charater of item is "-" -> Descending
    if( item.substring( 0, 1 ) == "-" ) {
      item = item.substring( 1 );
      dir = -1;
    }
    // Rename id field
    if( item == "id" ) item = "_id";
    // Add to sort array
    sort.push( [ item, dir ] );
  } );

  //// Build fields object
  var fields = {};
  if( obj.fields ) obj.fields.forEach( function( item ) {
    fields[ item ] = 1;
  } );

  //// Query object
  var query = obj.filter ? obj.filter : {};

  // Query options
  var opts = {
    limit: config.pagination.users,
    skip: config.pagination.users * page,
    sort: sort,
    fields: fields
  };

  // Execute count objects and query in parallel.
  var self = this;
  async.parallel( {
    count: function( cb ) { self.db.count( cb ); },
    query: function( cb ) { self.db.find( query, opts ).toArray( cb ); }
  }, function( err, res ) {
    if( err ) throw err;
    if( err ) return callback( {
      id:    'users-add-unkown',
      code:  500,
      title: "Unknown server error."
    } );

    // Rename id field
    res.query.forEach( function( item ) {
      item.id = item._id;
      delete item._id;
    } );

    // Emit event
    self.emit( 'find', res.query );

    // Callback result
    callback( null, {
      count: res.count,
      page:  page,
      limit: config.pagination.users,
      data:  res.query
    } );
  } );
},

// FUNC: Adds new user
// obj: {
//        id: (STR),
//        password: (STR), <-- Will be hashed
//        email: (STR),
//        enabled: (BOOL),
//        confirmed: (BOOL),
//        roles: { operator: (BOOL), guest: (BOOL), admin: (BOOL) }
//      }
ModelUsers.prototype.add = function( obj, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // CHECK SCHEMA
  var v = validate( obj, this.schema.add );
  // Not valid -> Examine first error message
  if( ! v.valid ) return this.schemaError.add( v.errors[0], callback );

  // SET DEFAULTS
  var now = new Date();
  obj.last_changed = now;
  obj.created = now;
  if( ! obj.enabled ) obj.enabled = true;
  if( ! obj.confirmed ) obj.confirmed = false;

  //
  // Save scope
  var self = this;
  async.parallel( {
    password:         function( cb ) { password.gen( obj.password, cb ) },
    confirmation_key: function( cb ) { crypto.randomBytes( 8, cb ) }
  }, function( err, res ) {
    if( err ) return callback({
      id:    'users-add-unkown',
      code:  500,
      title: "Unknown server error."
    } );

    // When not confirmed add confirmation_key
    if( !obj.confirmed ) {
      obj.confirmation_key = res.confirmation_key.toString('hex');
    }

    // Add password
    obj.password = res.password;

    // Rename id field
    obj._id = obj.id;
    delete obj.id;

    self.db.insert( obj, { w : 1 }, function( err, res ) {
      if( err ) {
        if( err.code == 11000 ) return callback( {
          id:    'users-add-id-taken',
          code:  409,
          title: "User ID already taken."
        } )
        else return callback( {
          id:    'users-add-unkown',
          code:  500,
          title: "Unknown server error."
        } )
      };

      // And rename id field another time
      res.id = res._id;
      delete res._id;

      // Emit event
      self.emit( 'add', res );

      // Callback
      callback( null, res );
    } );
  } );
},

// FUNC: Modifies user
// set: {
//        password: (STR), <-- Will be hashed
//        email: (STR),
//        enabled: (BOOL),
//        confirmed: (BOOL),
//        roles: { operator: (BOOL), guest: (BOOL), admin: (BOOL) }
//      }
ModelUsers.prototype.update = function( id, set, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // CHECK SCHEMA
  var v = validate( set, this.schema.update );
  // Not valid -> Examine first error message
  if( ! v.valid ) return this.schemaError.update( v.errors[0], callback );

  var self = this;
  async.waterfall( [
    function( cb ) {
      // Generate new password, when new one defined. Otherwise skip.
      if( set.password ) password.gen( set.password, cb );
      else cb( null, false );
    },
    function( pw, cb ) {
      // When a new password has generated, update obj
      if( pw ) set.password = pw;

      // When roles has been re-defined, transform object for mongodb
      if( set.roles ) {
        set["roles.admin"] = set.roles.admin;
        set["roles.operator"] = set.roles.operator;
        set["roles.guest"] = set.roles.guest;
        delete set.roles;
      }

      // Set last_changed
      set.last_changed = new Date();

      // Build modifier object
      var modify = { $set: set };

      // If confirmation is set to true, remove confirmation_key
      if( set.confirmed ) modify.$unset = { confirmation_key: '' };

      // Execute update
      self.db.findAndModify(
        { _id: id },
        [ [ '_id', 1 ] ],
        modify,
        { w: 1 },
        cb
      );
    }
  ], function( err, res ) {
    // Catch all errors
    if( err ) return callback( {
      id:    'users-update-unkown',
      code:  500,
      title: "Unknown server error."
    } );

    if( ! res ) return callback( {
      id:    'users-not-found',
      code:  404,
      title: "User not found"
    } );

    // Rename id field
    res.id = res._id;
    delete res._id;

    // Emit event
    self.emit( 'update', res );

    // Callback
    callback( null, res );
  } );
},

// FUNC: Removes user
ModelUsers.prototype.remove = function( id, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // DELETE QUERY
  var self = this;
  this.db.remove( { _id: id }, { w: 1 }, function( err, num ) {
    if( err ) return callback( {
      id:    'users-delete-unkown',
      code:  500,
      title: "Unknown server error."
    } );

    if( num == 0 ) return callback( {
      id:    'users-not-found',
      code:  404,
      title: "User not found"
    } );

    // Emit event
    self.emit( 'delete', id );

    callback( null, true );
  } )

}




  ////////////////////////
 // RETURN SINGLETON   //
////////////////////////

module.exports = new ModelUsers();
