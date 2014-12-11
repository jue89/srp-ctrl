  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var config = require( './lib/config.js' );
var mqtt = require( './lib/mqtt.js' );

var apsModel = require( './model/aps.js' );



  ////////////////////////
 // SETUP              //
////////////////////////

// Listen to add events
apsModel.on( 'add', function( ap ) {
  mqtt.publish( 'ap/add', JSON.stringify( {
    id: ap.id,
    public_key: ap.public_key
  } ) );
} );

// Listen to update events
apsModel.on( 'update', function( set, ap ) {
  // Only react to changes of the public key
  if( set.public_key ) mqtt.publish( 'ap/update', JSON.stringify( {
    id: ap.id,
    public_key: ap.public_key
  } ) );
} );

// Listen to remove events
apsModel.on( 'remove', function( ap ) {
  if( typeof ap == "string" ) ap = { id: ap };
  mqtt.publish( 'ap/remove', JSON.stringify( {
    id: ap.id
  } ) );
} );


  ////////////////////////
 // RETURN             //
////////////////////////

module.exports = mqtt;
