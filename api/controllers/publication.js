'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require ('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');


function probando (req, res){
	res.status(200).send({
		message: 'Hellow world from publications controller'
	});
}

function savePublication (req, res){
	var params = req.body;

	if (!params.text) return res.status(200).send({message: ' You have to send a text'});

	var publication = new Publication();

	publication.text = params.text;
	publication.file = 'null';
	publication.user = req.user.sub;
	publication.created_at = moment().unix();

	publication.save((err, publicationStored) =>{
		if (err) return res.status(500).send({message: 'Error while trying to save your publication'});

		if(!publicationStored) return res.status(404).send({message: 'Unable to save your publication'});

		return res.status(200).send({publication:publicationStored});
	});

}

function getPublications (req, res){
	var page = 1;
	if (req.params.page) {
		page =req.params.page;
	}

	var itemsPerPage = 4;

	Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) =>{
		if (err) return res.status(500).send({message: 'Error while retreiving the follows'});

		var follows_clean = [];

		follows.forEach((follow) =>{
			follows_clean.push(follow.followed);
		});

		follows_clean.push(req.user.sub);		

		Publication.find({user:{"$in": follows_clean}}).sort('-created_at').populate('user')
					.paginate(page,itemsPerPage,(err, publications, total) =>{
		if (err) return res.status(500).send({message: 'Error while retreiving publications'});

		if(!publications) return res.status(404).send({message: 'No publications'});

				return res.status(200).send({
					total_items: total,
					pages: Math.ceil(total/itemsPerPage),
					page: page,
					items_per_page: itemsPerPage, 
					publications
				});
		});
	});
}

function getPublicationsUser (req, res){
	var page = 1;
	if (req.params.page) {
		page =req.params.page;
	}

	var user = req.user.sub;

	if (req.params.user) {
		user = req.params.user;

	}

	var itemsPerPage = 4;

		Publication.find({user:user}).sort('-created_at').populate('user')
					.paginate(page,itemsPerPage,(err, publications, total) =>{
		if (err) return res.status(500).send({message: 'Error while retreiving publications'});

		if(!publications) return res.status(404).send({message: 'No publications'});

				return res.status(200).send({
					total_items: total,
					pages: Math.ceil(total/itemsPerPage),
					page: page,
					items_per_page: itemsPerPage, 
					publications
				});
		});
	
}

function getPublication(req,res){
	var publicationId = req.params.id;

	Publication.findById(publicationId, (err, publication)=>{

	if (err) return res.status(500).send({message: 'Error while retreiving publication'});

	if (!publication) return res.status(404).send({message: 'There is no publication'});

	return res.status(200).send({publication});

	});
}

function deletePublication(req, res){

	var publicationId = req.params.id;

	Publication.find({'user':req.user.sub, '_id':publicationId}).remove(err=>{
		if (err) return res.status(500).send({message: 'Error while deleting publication'});

		return res.status(200).send({message: 'Publication deleted succesfully'});
	});

}

//upload images/avatar to a user

function uploadImage (req,res){
	var publicationId = req.params.id;

	if (req.files) {
		var file_path = req.files.image.path;
		var file_split = file_path.split('\/');
		var file_name = file_split [2];
		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		
		if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' ) {

			Publication.findOne({'user':req.user.sub, '_id':publicationId}).exec((err, publication) =>{

				if (publication) {
			//Updating data for the publication

			Publication.findByIdAndUpdate(publicationId,{file: file_name}, {new:true},(err, publicationUpdated)=>{

				if (err) return res.status(500).send({message:'Request error'});

				//if (!publicationUpdated) return res.status(404).send({message:'Data not updated'});

				return res.status(200).send({publication: publicationUpdated});

					});

				} else {
				return removeFilesOfUploads(res, file_path, 'You dont have permissions to modify this publication');
				}
			});
			
		}else{

		}


	}else {
		return res.status(200).send({message: 'No images uploaded'});
	}	

}

function removeFilesOfUploads(res, file_path, message ){
	fs.unlink(file_path, (err)=>{
		return res.status(200).send({message: message});
	});
}

//return user image
function getImageFile(req,res){
	var image_ile = req.params.imageFile;

	var path_file = './uploads/publications/'+image_ile;

	fs.exists(path_file, (exists) =>{
		if (exists) {
			res.sendFile(path.resolve(path_file));
		}else {
			res.status(200).send({message: 'Image doesnt exists'});
		}
	});
}



module.exports = {
	probando,
	savePublication,
	getPublications,
	getPublication,
	getPublicationsUser,
	deletePublication,
	uploadImage,
	getImageFile
}
