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
var sessionsController = require('./controller/sessions.js');
var configController = require('./controller/config.js')



  ////////////////////////
 // SETUP              //
////////////////////////

// Configure app
var api = express.Router();
api.use( bodyParser.json({ type: 'application/*+json' }) );

// Install controller
authController( api );
jsonController( api );
usersController( api );
apsController( api );
udsController( api );
aaasController( api );
sessionsController( api );
configController( api );

// Catch all unhandled request
api.use( function( err, req, res, next ) {
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

var app = express();
app.use( '/v1.0', api );
module.exports = app;
