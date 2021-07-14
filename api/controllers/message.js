'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function probando(req, res){
	res.status(200).send({message: 'Hello from the mesasge controller'});
}

function saveMessage(req,res){

	var params = req.body;

	if(!params.text || !params.receiver) return res.status(200).send({message:'Fill required fields'});

	var message = new Message();

	message.sender = req.user.sub;
	message.receiver = params.receiver;
	message.text = params.text;
	message.created_at = moment().unix();
	message.viewed = 'false';
	message.save((err, messageStored) =>{

		if (err) return res.status(500).send({message:'Server error'});
		if(!messageStored) return res.status(404).send({message:'Unable to save message'});

		return res.status(200).send({message: messageStored});

	});
}

function getReceivedMessages(req, res){
	var userId = req.user.sub;
	var page = 1;
	if (req.params.page) {
		page = req.params.page;
	}

	var itemsPerPage = 4;

	Message.find({receiver: userId}).populate('sender', 'name surname image nickname _id ').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total)=>{
		if (err) return res.status(500).send({message:'Server error'});
		if (!messages) return res.status(404).send({message:'There are no messages to display'});
		return res.status(200).send({
			total: total,
			pages: Math.ceil(total/itemsPerPage),
			messages
		});
	});
}


function getSentMessages(req, res){
	var userId = req.user.sub;
	var page = 1;
	if (req.params.page) {
		page = req.params.page;
	}

	var itemsPerPage = 4;

	Message.find({sender: userId}).populate('sender receiver', 'name surname image nickname _id ').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total)=>{
		if (err) return res.status(500).send({message:'Server error'});
		if (!messages) return res.status(404).send({message:'There are no messages to display'});
		return res.status(200).send({
			total: total,
			pages: Math.ceil(total/itemsPerPage),
			messages
		});
	});
}

function getUnviewedMessages(req, res){
	var userId = req.user.sub;

	Message.count({receiver:userId, viewed: 'false'}).exec((err, count)=>{
		if (err) return res.status(500).send({message:'Server error'});
		return res.status(200).send({
			'unviewed': count
		});
	})
}

function setViewedMessages(req, res){
	var userId = req.user.sub;


	Message.update({receiver:userId, viewed: 'false'}, {viewed: 'true'}, {"multi": true}).exec((err, messagesUpdated)=>{
		if (err) return res.status(500).send({message:'Server error'});

		return res.status(200).send({
			messages: messagesUpdated
		});
	})
}


module.exports = {
	probando,
	saveMessage,
	getReceivedMessages,
	getSentMessages,
	getUnviewedMessages,
	setViewedMessages
};