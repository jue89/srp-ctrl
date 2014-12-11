  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

// Libs
var express = require( 'express' );
var cors = require('cors');
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
authController( api );
jsonController( api );
api.use( bodyParser.json({ type: 'application/*+json' }) );

// Install controller
usersController( api );
apsController( api );
udsController( api );
aaasController( api );
sessionsController( api );
configController( api );

// Catch all unhandled request
api.use( function( err, req, res, next ) {
  if( err ) {
    console.error( err );
    res.statusCode = 500;
    res.endJSON( {
      id: 'internal-error',
      code: 500,
      title: 'Something went wrong. Check your syntax.'
    } );
    res.endJSON('');
  } else {
    res.statusCode = 404;
    res.endJSON( {
      id: 'not-found',
      code: 404,
      title: 'Not Found.'
    } );
  }
} );



  ////////////////////////
 // RETURN             //
////////////////////////

var app = express();
app.use( cors() );
app.use( '/v1.0', api );
module.exports = app;
