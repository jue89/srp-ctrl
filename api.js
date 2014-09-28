  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

// Libs
var express = require( 'express' );

// Controller
var authController = require('./controller/auth.js');



  ////////////////////////
 // SETUP              //
////////////////////////

// Configure app
var app = express();


// Install controller
authController( app );


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
