'use strict'

//connecting to DB in local host server//
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;


mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/socialPiesDb', {useNewUrlParser:true, useUnifiedTopology: true}/**{useMongoClient: true}**/ )
		.then( () => {
			console.log("Database connection was successfull!!!"); 

			//creating the server
			app.listen(port, () =>{
				console.log("The server is running in http://localhost:3800");
			});
		})
		.catch(err => console.log(err));
//this is the end of the DB connection script//


