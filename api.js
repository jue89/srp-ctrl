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

// Catch all unhandled request
app.use( function( req, res ) {
  res.statusCode = 404;
  res.end('Not Found');
} );



  ////////////////////////
 // RETURN             //
////////////////////////

module.exports = {
  start: function( port ) { app.listen( port ); }
}
