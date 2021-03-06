'use strict'

var mongoose = require('mongoose');
var Schema =mongoose.Schema;

var messageSchema = Schema({
	text: String,
	viewed: String,
	created_at: String,
	sender: {type: Schema.ObjectId, ref: 'User'},
	receiver: {type: Schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Message', messageSchema);