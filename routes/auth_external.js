module.exports = function(router){

	const fs = require('fs');
	const path = require('path');

	router.get('/auth_external', function(req, res) {

		//let's validate the request from the user (make sure is signed properly with the user's id and key received via the genie/add, genie/init , etc events.
			req.app.get('genieApi').isValidClientRequest(req, function(userKey, cb){
				
			//we save the key and secret to a user in our db of choice so let's get the secret for this user
			req.app.get('redis').get('member_' + userKey, function(e,data){
				if (e){
					return cb(e);
				}

				try{
					data = JSON.parse(data);
				} catch (E){
					return cb(E);
				}

				return cb(null, (data && data.secret ? data.secret : null));	
			});
			
		}, function(err, validRequest){
			
			if (err || !validRequest){
				return res.status(401).json({error:'invalid client auth'}).end();	
			}


			fs.createReadStream(path.join(__dirname, '../public/auth_external.html')).pipe(res);

		});	


		});

	return router;
}
