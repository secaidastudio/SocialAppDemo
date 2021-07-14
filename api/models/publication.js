'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var publicationSchema = Schema({
	text: String,
	viewed: String,
	file: String,
	created_at: String,
	//testText:String,
	user: { type:Schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Publication', publicationSchema);