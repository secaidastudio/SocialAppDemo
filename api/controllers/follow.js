'use strict'
/**var path = require('path');
var fs = require('fs');**/
var mongoosePaginate = require('mongoose-pagination');

var user = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req,res){
	
	var params = req.body;

	var follow = new Follow();

	follow.user = req.user.sub;
	follow.followed = params.followed;

	follow.save((err, followStored)=>{
		if (err) return res.status(500).send({message:'An error occurred when saving the follow'});

		if (!followStored) return res.status(404).send({message: 'Unable to save the follow'});

		return res.status(200).send({follow: followStored});
	});
}

//remove a follow STILL NOT WORKING....NEED TO CHECK DOCUMMENTATION ABOUT IT

function deleteFollow(req,res){

	var userId = req.user.sub;
	var followId = req.params.id;

	/**Follow.deleteOne({'user':userId,'followed': followId}).then(function(){
		return res.status(200).send({message:'The followed has been removed'});
	}).catch(function(error){
		return res.status(500).send({message:'Error trying to unfollow'});
	});**/

	Follow.find({'user': userId, 'followed': followId}).remove(err =>{
		if (err) return res.status(500).send({message:'An error occurred while trying to unfollow'});

		return res.status(200).send({message:'Correctly unfollowed!!'});
	});	
}

//List of users tham I'm following

function getFollowingUsers(req,res){
	var userId = req.user.sub;

	if (req.params.id && req.params.page) {
		userId = req.params.id;
	}

	var page = 1;

	if (req.params.page) {
		page = req.params.page;
	} else {
		page = req.params.id;
	}

	var itemsPerPage = 4;

	Follow.find({user:userId}).populate({path: 'followed'}).paginate(page,itemsPerPage, (err, follows, total) =>{

		if (err) return res.status(500).send({message:'Server error'});

		if(!follows) return res.status(404).send({message: 'You are not following any user'});

		followUsersId(req.user.sub).then((value)=>{

			return res.status(200).send({
				total: total,
				pages: Math.ceil(total/itemsPerPage),
				follows,
				users_following: value.following,
				users_following_me: value.followed,
			});
		});
	});

}


async function followUsersId(user_id) {

	var following = await Follow.find({ user: user_id }).select({ _id: 0, __v: 0, user: 0 })
	.exec()
	.then((follows) => {
		var follows_clean = [];
		follows.forEach((follow) => {
			follows_clean.push(follow.followed);
		});

		return follows_clean;

	})
	.catch((err) => {

		return handleError(err);

	});

	var followed = await Follow.find({ followed: user_id }).select({ _id: 0, __v: 0, followed: 0 })
	.exec()
	.then((follows) => {
		var follows_clean = [];
		follows.forEach((follow) => {
			follows_clean.push(follow.user);
		});

		return follows_clean;

	})
	.catch((err) => {

		return handleError(err);

	});

	return {

		following: following,

		followed: followed

	};
}


//list of users who are following me

function getFollowedUsers(req, res){
	var userId = req.user.sub;

	if (req.params.id && req.params.page) {
		userId = req.params.id;
	}

	var page = 1;

	if (req.params.page) {
		page = req.params.page;
	} else {
		page = req.params.id;
	}

	var itemsPerPage = 4;

	Follow.find({followed:userId}).populate('user').paginate(page,itemsPerPage, (err, follows, total) =>{

		if (err) return res.status(500).send({message:'Server error'});

		if(!follows) return res.status(404).send({message: 'No one is following you'});

		followUsersId(req.user.sub).then((value)=>{

			return res.status(200).send({
				total: total,
				pages: Math.ceil(total/itemsPerPage),
				follows,
				users_following: value.following,
				users_following_me: value.followed,
			});
		});
	});
}

//List of users 
function getMyFollows(req, res){
	var userId = req.user.sub;
	
	var find = Follow.find({user:userId});
	
	if (req.params.followed) {
		find = Follow.find({followed:userId});
	}

	find.populate('user followed').exec((err, follows) =>{
		if (err) return res.status(500).send({message:'Server error'});

		if(!follows) return res.status(404).send({message: 'You are not following no one'});

		return res.status(200).send({follows})
	});

}



module.exports = {

	saveFollow,
	deleteFollow,
	getFollowingUsers,
	getFollowedUsers,
	getMyFollows

}