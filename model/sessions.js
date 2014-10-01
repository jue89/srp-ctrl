  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var async = require( 'async' );
var util = require( 'util' );
var EventEmitter = require( 'events' ).EventEmitter;
var validate = require( 'json-schema' );
var config = require( '../lib/config.js' );
var mongo = require( '../lib/db.js' );
var helper = require( '../lib/helper.js' );
var aps = require( '../model/aps.js' );
var uds = require( '../model/uds.js' );


  ////////////////////////
 // CONSTRUCTOR        //
////////////////////////

function ModelSessions() {

  // Connect to collection
  this.db = null;
  var self = this;
  mongo( 'sessions', [ 'ap_id', 'ud_id' ], function( db ){
    // Connected: Save instance and emit event
    self.db = db;
    self.emit( 'ready' );
  } );

  // Load schemas
  this.schema = {
    add: require( './sessions.add.json' ),
    update: require( './sessions.update.json' )
  }
  this.schemaError = {
    add: require( './sessions.add.js' ),
    update: require( './sessions.update.js' )
  }

}



  ////////////////////////
 // EVENT EMITTER      //
////////////////////////

util.inherits( ModelSessions, EventEmitter );



  ////////////////////////
 // PROTOTYPES         //
////////////////////////

// PRIVATE FUNC: Helper funtion that checks all preconditions.
ModelSessions.prototype._checkPreconditions = function( callback ) {
  // Connection to sessions collection must be established
  if( ! this.db ) {
    // Call callback function
    callback( {
      id:    'sessions-no-database-connection',
      code:  500,
      title: "Connection to database is not available. Please try again later."
    } );

    // Return false: Conditions not met
    return false;
  }

  // Return: Everything is fine :)
  return true;
}


// FUNC: Get sessions by id
// obj: {
//        fields: [ field1, field2, ... ],
//        filter: { field1: (STR), field2: (STR) }
//      }
ModelSessions.prototype.get = function( id, obj, callback ) {
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
      case 'ap_id': q['ap_id'] = f.ap_id; break;
      case 'ud_id': q['ud_id'] = f.ud_id; break;
      case 'ended': q['ended'] = helper.parseBool( f.ended ); break;
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
      id:    'sessions-db-error',
      code:  500,
      title: err
    } );

    // Object not found
    if( ! res ) return callback( {
      id:    'sessions-not-found',
      code:  404,
      title: "Sessions not found."
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

// FUNC: Find sessions
// obj: {
//        page: (int),
//        filter: { field1: (STR), field2: (STR) },
//        fields: [ field1, field2, ... ],
//        sort: [ -field1, field2, ... ]
//      }
ModelSessions.prototype.find = function( obj, callback ) {
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
      case 'ap_id': q['ap_id'] = f.ap_id; break;
      case 'ud_id': q['ud_id'] = f.ud_id; break;
      case 'ended': q['ended'] = helper.parseBool( f.ended ); break;
    }
  }

  // Query options
  var opts = {
    limit: config.pagination.sessions,
    skip: config.pagination.sessions * page,
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
      id:    'sessions-add-unkown',
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
      limit: config.pagination.sessions,
      data:  res.query
    } );
  } );
}

// FUNC: Adds new sessions
// obj: {
//        user_id: (STR),
//        public_key: (STR)
//      }
ModelSessions.prototype.add = function( obj, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // CHECK SCHEMA
  var v = validate( obj, this.schema.add );
  // Not valid -> Examine first error message
  if( ! v.valid ) return this.schemaError.add( v.errors[0], callback );

  // SET DEFAULTS
  var now = new Date();
  var session = {
    _id: obj.id,
    ap_id: obj.ap_id,
    ud_id: obj.ud_id,
    ended: false,
    begin: now,
    last_seen: null,
    sent_bytes: 0,
    received_bytes: 0
  }

  var self = this;
  async.waterfall( [
    function( done ) {
      // Ensure stated ap exists
      aps.get( session.ap_id, {}, done );
    },
    function( ap, done ) {
      // Ensure stated ud exists
      uds.get( session.ud_id, {}, done );
    },
    function( ud, done ) {
      // Insert into database
      self.db.insert( session, { w : 1 }, done );
    }
  ], function( err, session ) {
    if( err ) {
      if( err.code == 404 ) return callback( {
        id:    'sessions-add-ap_ud_id-invalid',
        code:  404,
        title: "AP or UD not found."
      } );

      return callback({
        id:    'sessions-add-unkown',
        code:  500,
        title: "Unknown server error."
      } );
    }

    // Decapsulate
    session = session[0];

    // And rename id field another time
    session.id = session._id;
    delete session._id;

    // Emit event
    self.emit( 'add', session );

    // Callback
    callback( null, session );
  } );
}

// FUNC: Modifies session
// id:  { field1: (STR), field2: (STR), ... }
// set: {
//        user_id: (STR),
//        public_key: (STR)
//      }
ModelSessions.prototype.update = function( id, set, callback ) {
  // CHECK PRECONDITIONS
  if( ! this._checkPreconditions( callback ) ) return;

  // CHECK SCHEMA
  var v = validate( set, this.schema.update );
  // Not valid -> Examine first error message
  if( ! v.valid ) return this.schemaError.update( v.errors[0], callback );

  // Set last_seen
  set.last_changed = new Date();

  // Build query
  var q = {};
  if( typeof id == "string" ) {
    q['_id'] = id;
  } else {
    for( i in id) {
      switch( i ) {
        case 'id': q['_id'] = id.id; break;
        case 'ap_id': q['ap_id'] = id.ap_id; break;
        case 'ud_id': q['ud_id'] = id.ud_id; break;
      }
    }
  }

  // Ended sessions can't be changed
  q['ended'] = false;

  var self = this;
  // Insert into database
  this.db.findAndModify(
    q,
    [ [ '_id', 1 ] ],
    { $set: set },
    { w: 1, new: true },
    function( err, session ) {
      if( err ) {
        if( err.code == 404 ) return callback( {
          id:    'sessions-update-user_id-invalid',
          code:  404,
          title: "User not found or not an administrator."
        } );

        return callback({
          id:    'sessions-update-unkown',
          code:  500,
          title: "Unknown server error."
        } );
      }

      if( ! session ) return callback( {
        id:    'sessions-not-found',
        code:  404,
        title: "Session not found."
      } );

      // And rename id field another time
      session.id = session._id;
      delete session._id;

      // Emit event
      self.emit( 'update', set, session );

      // Callback
      callback( null, session );
    }
  );
}




  ////////////////////////
 // RETURN SINGLETON   //
////////////////////////

module.exports = new ModelSessions();
