module.exports = function(router){

	router.all('/genie_profile', function(req, res) {

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
				
				var retData = {
					data: [
						//mark external connect button as connected on profile
						{
							name: 'external',
							value: true,
						},

						{
							name: 'name',
							value: 'Giphy',
						}
						],
					}

					res.status(200).json(retData).end();

				});

		return router;
	});


	return router;

}
