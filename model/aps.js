  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var async = require( 'async' );
var util = require( 'util' );
var EventEmitter = require( 'events' ).EventEmitter;
var validate = require( 'json-schema' );
var crypto = require( 'crypto' );
var ObjectID = require('mongodb').ObjectID;
var config = require( '../lib/config.js' );
var mongo = require( '../lib/db.js' );
var helper = require( '../lib/helper.js' );
var users = require( '../model/users.js' );


  ////////////////////////
 // CONSTRUCTOR        //
////////////////////////

function ModelAps() {

  // Connect to collection
  this.db = null;
  var self = this;
  mongo( 'aps', [ 'user_id', 'ipv6_id' ], function( db ){
    // Connected: Save instance and emit event
    self.db = db;
    self.emit( 'ready' );
  } );

  // Load schemas
  this.schema = {
    add: require( './aps.add.json' ),
    update: require( './aps.update.json' )
  }
  this.schemaError = {
    add: require( './aps.add.js' ),
    update: require( './aps.update.js' )
  }

}



  ////////////////////////
 // EVENT EMITTER      //
////////////////////////

util.inherits( ModelAps, EventEmitter );



  ////////////////////////
 // PROTOTYPES         //
////////////////////////

// PRIVATE FUNC: Helper funtion that checks all preconditions.
ModelAps.prototype._checkPreconditions = function( callback ) {
  // Connection to aps collection must be established
  if( ! this.db ) {
    // Call callback function
    callback( {
      id:    'aps-no-database-connection',
      code:  500,
      title: "Connection to database is not available. Please try again later."
    } );

    // Return false: Conditions not met
    return false;
  }

  // Return: Everything is fine :)
  return true;
}


// FUNC: Get ap by id
// obj: {
//        fields: [ field1, field2, ... ],
//        filter: { field1: (STR), field2: (STR) }
//      }
ModelAps.prototype.get = function( id, obj, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;


  // PREPARE ALL DATA

  // Create fields object
  var fields = {};
  if( obj.fields ) obj.fields.forEach( function( item ) {
    fields[ item ] = 1;
  } );

  // Side conditions
  q = {
    _id: id
  };
  var f = obj.filter;
  for( i in obj.filter ) {
    switch( i ) {
      case 'user_id': q['user_id'] = f.user_id; break;
      case 'ipv6_id': q['ipv6_id'] = f.ipv6_id; break;
    }
  }

  // Query options
  var opts = {
    fields: fields
  };

  // REQUEST OBJECT FROM DATABASE
  var self = this;
  this.db.findOne( q, opts, function( err, res ) {
    if( err ) return callback( {
      id:    'aps-db-error',
      code:  500,
      title: err
    } );

    // Object not found
    if( ! res ) return callback( {
      id:    'aps-not-found',
      code:  404,
      title: "AP not found"
    } );

    // Rename id
    res.id = res._id;
    delete res._id;

    // Emit event
    self.emit( 'get', res );

    // Callback
    callback( null, res );
  } );
}

// FUNC: Find aps
// obj: {
//        page: (int),
//        filter: { field1: (STR), field2: (STR) },
//        fields: [ field1, field2, ... ],
//        sort: [ -field1, field2, ... ],
//        limit: (INT)
//      }
ModelAps.prototype.find = function( obj, callback ) {
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
  var q = {};
  var f = obj.filter;
  for( i in f ) {
    switch( i ) {
      case 'user_id': q['user_id'] = f.user_id; break;
      case 'ipv6_id': q['ipv6_id'] = f.ipv6_id; break;
    }
  }

  // Query options
  var limit = obj.limit != null ? parseInt( obj.limit ) : config.pagination.aps;
  var opts = {
    limit: limit,
    skip: limit * page,
    sort: sort,
    fields: fields
  };

  // Execute count objects and query in parallel.
  var self = this;
  async.parallel( {
    count: function( cb ) { self.db.count( q, cb ); },
    query: function( cb ) { self.db.find( q, opts ).toArray( cb ); }
  }, function( err, res ) {
    if( err ) throw err;
    if( err ) return callback( {
      id:    'aps-add-unkown',
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
      limit: limit,
      data:  res.query
    } );
  } );
}

// FUNC: Adds new ap
// obj: {
//        user_id: (STR),
//        public_key: (STR)
//      }
ModelAps.prototype.add = function( obj, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // CHECK SCHEMA
  var v = validate( obj, this.schema.add );
  // Not valid -> Examine first error message
  if( ! v.valid ) return this.schemaError.add( v.errors[0], callback );

  // SET DEFAULTS
  var now = new Date();
  var id = new ObjectID().toString();
  var ap = {
    _id: id,
    created: now,
    last_seen: now,
    user_id: obj.user_id,
    public_key: obj.public_key,
    ipv6_id: helper.objectIDtoIPv6( id )
  }

  var self = this;
  async.waterfall( [
    function( done ) {
      // Ensure stated user exists and is operator
      users.get( ap.user_id, { filter: { operator: true } }, done );
    },
    function( user, done ) {
      // Generate secret
      crypto.randomBytes( 24, done );
    },
    function( secret, done ) {
      // Save generated secret
      ap.aaa_secret = secret.toString('base64');

      // Insert into database
      self.db.insert( ap, { w : 1 }, done );
    }
  ], function( err, ap ) {
    if( err ) {
      if( err.code == 404 ) return callback( {
        id:    'aps-add-user_id-invalid',
        code:  404,
        title: "User not found or not an operator."
      } );

      return callback({
        id:    'aps-add-unkown',
        code:  500,
        title: "Unknown server error."
      } );
    }

    // Decapsulate
    ap = ap[0];

    // And rename id field another time
    ap.id = ap._id;
    delete ap._id;

    // Emit event
    self.emit( 'add', ap );

    // Callback
    callback( null, ap );
  } );
}

// FUNC: Modifies ap
// id:  { field1: (STR), field2: (STR), ... }
// set: {
//        user_id: (STR),
//        public_key: (STR)
//      }
ModelAps.prototype.update = function( id, set, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // CHECK SCHEMA
  var v = validate( set, this.schema.update );
  // Not valid -> Examine first error message
  if( ! v.valid ) return this.schemaError.update( v.errors[0], callback );

  // Set last_seen
  set.last_seen = new Date();

  // Build query
  var q = {};
  if( typeof id == "string" ) {
    q['_id'] = id;
  } else {
    for( i in id) {
      switch( i ) {
        case 'id': q['_id'] = id.id; break;
        case 'user_id': q['user_id'] = id.user_id; break;
        case 'ipv6_id': q['ipv6_id'] = id.ipv6_id; break;
      }
    }
  }

  var self = this;
  async.waterfall( [
    function( done ) {
      if( set.user_id ) {
        // Ensure stated user exists and is operator
        users.get( set.user_id, { filter: { operator: true } }, done );
      } else {
        // Skip when user_id is not changed
        done( null, true );
      }
    },
    function( user, done ) {
      // Insert into database
      self.db.findAndModify(
        q, [ [ '_id', 1 ] ], { $set: set }, { w: 1, new: true }, done
      );
    }
  ], function( err, ap ) {
    if( err ) {
      if( err.code == 404 ) return callback( {
        id:    'aps-update-user_id-invalid',
        code:  404,
        title: "User not found or not an operator."
      } );

      return callback({
        id:    'aps-update-unkown',
        code:  500,
        title: "Unknown server error."
      } );
    }

    if( ! ap ) return callback( {
      id:    'aps-not-found',
      code:  404,
      title: "AP not found"
    } );

    // And rename id field another time
    ap.id = ap._id;
    delete ap._id;

    // Emit event
    self.emit( 'update', set, ap );

    // Callback
    callback( null, ap );
  } );
}

// FUNC: Removes ap
// id:  { field1: (STR), field2: (STR), ... }
ModelAps.prototype.remove = function( id, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // Build query
  var q = {};
  if( typeof id == "string" ) {
    q['_id'] = id;
  } else {
    for( i in id ) {
      switch( i ) {
        case 'id': q['_id'] = id.id; break;
        case 'user_id': q['user_id'] = id.user_id; break;
        case 'ipv6_id': q['ipv6_id'] = id.ipv6_id; break;
      }
    }
  }

  // DELETE QUERY
  var self = this;
  this.db.remove( q, { w: 1 }, function( err, num ) {
    if( err ) return callback( {
      id:    'aps-delete-unkown',
      code:  500,
      title: "Unknown server error."
    } );

    if( num == 0 ) return callback( {
      id:    'aps-not-found',
      code:  404,
      title: "AP not found"
    } );

    // Emit event
    self.emit( 'delete', id );

    callback( null, true );
  } )

}




  ////////////////////////
 // RETURN SINGLETON   //
////////////////////////

module.exports = new ModelAps();
