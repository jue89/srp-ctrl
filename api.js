  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

// Libs
var express = require( 'express' );
var bodyParser = require( 'body-parser' );

// Controller
var authController = require('./controller/auth.js');
var jsonController = require('./controller/json.js');
var usersController = require('./controller/users.js');
var apsController = require('./controller/aps.js');
var udsController = require('./controller/uds.js');
var aaasController = require('./controller/aaas.js');



  ////////////////////////
 // SETUP              //
////////////////////////

// Configure app
var app = express();
app.use( bodyParser.json({ type: 'application/*+json' }) );


// Install controller
authController( app );
jsonController( app );
usersController( app );
apsController( app );
udsController( app );
aaasController( app );



// Catch all unhandled request
app.use( function( err, req, res, next ) {
  if( err ) {
    res.statusCode = 500;
    res.end('Something went wrong. Check your syntax.');
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
} );



  ////////////////////////
 // RETURN             //
////////////////////////

module.exports = {
  start: function( port ) { app.listen( port ); }
}
