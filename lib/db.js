// Requirements
var mongo = require('mongodb').MongoClient;
var async = require('async');

// Configuration
var config = require( "./config.js" );

// Connection instance
var _con;
function getCon( callback ) {
  // Instance found: return instance
  if( _con ) return callback( _con );

  // Otherwise create instance
  mongo.connect( config.db, function( err, con ){
    if( err ) throw err;

    _con = con;
    return callback( con );
  } );
}

// Collection instances
var _col = {};
module.exports = function( collection, index, callback ){
  // Instance found: return instance
  if ( _col[ collection ] ) return callback( _col[ collection ] );

  // Otherwise create instance: First fetch database connection, then create collection
  getCon( function( con ) {
    con.createCollection( collection, function( err, col ) {
      if( err ) throw err;

      _col[ collection ] = col;

      // Create indexes when needed, otherwise return collection
      if( index.length ) {
        // Create all indices
        async.each( index, function( item, callback ){
          col.ensureIndex( item, callback );
        }, function( err ) {
          if( err ) throw err;

          // Indices created
          return callback( col );
        } );
      } else {
        return callback( col );
      }
    } );
  } );
}
