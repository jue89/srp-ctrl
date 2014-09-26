// Configuration file
var file = process.env.CONFIG ? process.env.CONFIG : "default";
module.exports = require( "../config/" + file + ".json" );
