/**********************************************************************\
 * STUDIENARBEIT submitted by Juergen Fitschen <me@jue.yt>            *
 * Supervised by Dipl.-Ing. David Dietrich                            *
 * Examined   by Prof. Dr. Panagiotis Papadimitriou                   *
 *           and Prof. Dr.-Ing. Markus Fidler                         *
\**********************************************************************/


var config = require( './lib/config.js' );


  ////////////////////////
 // REST API           //
////////////////////////
var api = require( './api.js' );
api.listen( config.port, '127.0.0.1' );


  ////////////////////////
 // NOTIFIER           //
////////////////////////
var notifier = require( './notify-aaa.js' );


  ////////////////////////
 // HEARTBEAT          //
////////////////////////
require( './heartbeat.js' );


  ////////////////////////
 // LOG                //
////////////////////////
require( './log.js' );

