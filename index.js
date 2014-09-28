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
api.start( config.port );
