// Helper module for examining returned error
module.exports = function( err, callback ) {
  var p = err.property;
  var m = err.message;

  switch( p ) {
    case '':
      return callback( {
        id:    'aps-update-unallowed-property',
        code:  409,
        title: "Unallowd property provided."
      } );

    case 'last_ap_id':
      return callback( {
        id:    'uds-add-last_ap_id-malformed',
        code:  409,
        title: "Malformed AP ID."
      } );

    default:
      return callback( {
        id:    'uds-add-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
