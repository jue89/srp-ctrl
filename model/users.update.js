// Helper module for examining returned error
module.exports = function( err, callback ) {
  var p = err.property;
  var m = err.message;

  switch( p ) {
    case '':
      return callback( {
        id:    'users-update-unallowed-property',
        code:  409,
        title: "Unallowd property provided."
      } );

    case 'email':
      return callback( {
        id:    'users-update-email-malformed',
        code:  409,
        title: "Malformed e-mail address."
      } );

    case 'password':
      return callback( {
        id:    'users-update-password-malformed',
        code:  409,
        title: "Password must have at least 8 characters."
      } );

    case 'roles':
    case 'roles.admin':
    case 'roles.guest':
    case 'roles.operator':
      return callback( {
        id:    'users-update-roles-malformed',
        code:  409,
        title: "Roles format is wrong."
      } );

    default:
      return callback( {
        id:    'users-update-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
