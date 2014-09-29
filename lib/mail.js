var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var config = require( './config.js' );

module.exports = nodemailer.createTransport(
  smtpTransport(config.mail.transporter)
);
