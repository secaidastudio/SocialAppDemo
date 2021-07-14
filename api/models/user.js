'use strict'

var mongoose = require('mongoose');
var schema = mongoose.Schema;
var userSchema = schema({
	name: String,
	surname: String,
	nickname: String,
	email: String,
	password: String,
	role: String,
	image: String,
	
});

module.exports = mongoose.model('User', userSchema);	