'use strict'
var bcrypt = require('bcrypt-nodejs');

var mongoosePaginate = require('mongoose-pagination');

var fs = require('fs');

var path = require('path');

var User = require('../models/user');

var jwt = require('../services/jwt');

var Follow = require ('../models/follow');

var Publication = require ('../models/publication');

function home (req,res) {
	res.status(200).send({
		message: 'Hello World from NodeJs server'
	});
}

function tests (req,res) {
	
	res.status(200).send({
		message: 'This is a test for server'
	});
}





//creating a new user

function saveUser (req,res){
	var params = req.body;
	var user = new User();

	if (params.name && params.surname && params.nickname && params.email && params.password) {

		user.name = params.name;
		user.surname = params.surname;
		user.nickname = params.nickname;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;

//finding duplicate users
User.find({
	$or: [
	{email: user.email.toLowerCase()},
	{nickname: user.nickname.toLowerCase()}
	]


}).exec ((err, users) =>{
	if (err) return res.status(500).send({message:'Unable to process your request'});

	if (users && users.length >=1) {
		return res.status(200).send({message: 'User already exists'});
	} else {
		bcrypt.hash(params.password,null, null, (err, hash) => {
			user.password = hash;

			user.save((err, userStored)=> {
				if(err) return res.status(500).send({message: 'Error saving users data'});

				if (userStored) {

					res.status(200).send({user: userStored});
				} else {
					res.status(404).send({message: 'User not registered'});
				}
			});
		});
	}
});

//ending of searching for duplicate users



} else {
	res.status(200).send({
		message: 'Fill all required fields'
	});
}
}





//login user function

function loginUser(req,res){

	var params = req.body;
	
	var email = params.email;
	var password = params.password;

	User.findOne({email: email}, (err,user)=>{
		if (err) return res.status(500).send({message: 'Error at request'});

		if (user) {
			bcrypt.compare(password, user.password, (err,check)=>{
				if (check) {
					//return user data

					if (params.gettoken) {
							//generate and return token
							
							return res.status(200).send({
								token: jwt.createToken(user)
							});
							
						}else {
							//return user data

							//to avoid returning the password
							user.password = undefined;
							return res.status(200).send({user});
						}

						
					}else{
						res.status(404).send({message: 'Unable to login'});
					}
				});
		} else {
			res.status(404).send({message: 'User not registered'});
		}
	});
};




//getting users data

function getUser(req, res){
	var userId = req.params.id;

	User.findById(userId, (err,user)=> {
		if (err) return res.status(500).send({message:'Request error'});

		if (!user) return res.status(404).send({message:'User does not exists'});

		followThisUser(req.user.sub, userId).then((value)=>{
			return res.status(200).send({
				user, 
				following: value.following,
				followed: value.followed
			});
		});		
	});
}

async function followThisUser(identity_user_id, user_id){
	var following = await Follow.findOne({user: identity_user_id, followed:user_id}).exec()
	.then((following) => {
		return following;
	})
	.catch((err) =>{
		return handleError(err);
	});


	var followed = await Follow.findOne({user: user_id, followed: identity_user_id}).exec()
	.then((followed)=>{
		return followed;
	})
	.catch((err)=>{
		return handleError(err);
	});

	return {
		following: following,
		followed: followed
	};
}


//return a list of users paginated

function getUsers(req, res){
	var identity_user_id = req.user.sub;

	var page = 1;
	if (req.params.page) {

		page = req.params.page;
	}

	var itemsPerPage = 5;

	User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total)=>{

		if (err) return res.status(500).send({message:'Request error'});
		if (!users) return res.status(404).send({message:'User does not exists'});

		followUsersId(identity_user_id).then((value)=>{
			return res.status(200).send({
				users,
				users_following: value.following,
				users_following_me: value.followed,
				total,
				pages: Math.ceil(total/itemsPerPage)
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


const getCounters = (req, res) => {
	let userId = req.user.sub;
	if(req.params.id){
		userId = req.params.id;      
	}
	getCountFollow(userId).then((value) => {
		return res.status(200).send(value);
	})
}

const getCountFollow = async (user_id) => {
	try{
        // Lo hice de dos formas. "following" con callback de countDocuments y "followed" con una promesa
        let following = await Follow.countDocuments({"user": user_id},(err, result) => { return result });
        let followed = await Follow.countDocuments({"followed": user_id}).then(count => count);
        let publications = await Publication.countDocuments({"user": user_id}).then(count=> count);
        return { following, followed, publications };
        
    } catch(e){
    	console.log(e);
    }

    
}


//Update users data

function updateUser (req, res){

	var userId = req.params.id;
	var update = req.body;

	//remove password parameter from the request
	delete update.password;

	if (userId != req.user.sub ) {

		return res.status(500).send({message:'You dont have permissions to update users data'});
	}

	User.find({
		$or: [
		{email: update.email.toLowerCase()},
		{nickname: update.nickname}
		]


	}).exec((err, users) =>{

		console.log(users);
		var user_isset = false;
		users.forEach((user)=>{

			
			if(user && user._id != userId)  user_isset = true;		
		});

		if (user_isset) return res.status(404).send({message: 'Data already exists'});

		



		
		


		User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated)=>{
			if (err) return res.status(500).send({message:'Unable to update user'});

			if (!userUpdated) return res.status(404).send({message:'Data not updated'});

			return res.status(200).send({user: userUpdated});
		});

	});

	

}





//upload images/avatar to a user

function uploadImage (req,res){
	var userId = req.params.id;

	if (req.files) {
		var file_path = req.files.image.path;
		console.log (file_path);

		var file_split = file_path.split('\/');
		console.log(file_split);

		var file_name = file_split [2];
		console.log(file_name);

		var ext_split = file_name.split('\.');
		console.log(ext_split);

		var file_ext = ext_split[1];
		console.log(file_ext);

		if (userId != req.user.sub ) {
			return removeFilesOfUploads(res, file_path, 'You dont have permissions to update users data');

		}


		if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg') {

			//Updating data for logged doc

			User.findByIdAndUpdate(userId,{image: file_name}, {new:true},(err, userUpdated)=>{

				if (err) return res.status(500).send({message:'Request error'});

				if (!userUpdated) return res.status(404).send({message:'Data not updated'});

				return res.status(200).send({user: userUpdated});

			});
		}else{
			return removeFilesOfUploads(res, file_path, 'File extension not valid');
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

	var path_file = './uploads/users/'+image_ile;

	fs.exists(path_file, (exists) =>{
		if (exists) {
			res.sendFile(path.resolve(path_file));
		}else {
			res.status(200).send({message: 'Image doesnt exists'});
		}
	});
}

module.exports = {
	home,
	tests,
	saveUser,
	loginUser,
	getUser,
	getUsers,
	getCounters,
	updateUser,
	uploadImage,
	getImageFile
}