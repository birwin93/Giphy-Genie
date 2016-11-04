const config = require('./config'); 
const genieApi = require('genie.apiclient');
genieApi.config(config.api);

var payload = {

	name: {
		value: 'Sample genie'
	},

	description: {
		value: 'A sample genie that you can play with'
	},

	permissions: ['genie/global'],
	availability: '*',
	subscriptions: '*',

	client: {

		images: [

		{
			name: 'avatar',
			url: config.url + '/images/avatar.png',
		},

		{
			name: 'avatar_chat',
			url: config.url + '/images/avatar_chat.png',
		},

		{
			name: 'header_image',
			url: config.url + '/images/header.png',
		}

		],

		profile: {
			type: 'profile',
			header: 'header_image',
		}

	}

}

//let's register this payload
genieApi.post('/genies/payloads', payload, function(e,r,b){

	if (e){
		console.error(e);
		process.exit(1);
	}

	if ([200,201].indexOf(r.statusCode) == -1){
		console.error('payload registration failed with http statusCode', r.statusCode);
		process.exit(1);
	}

	//payload registration was succesfull, let's activate this new payload id
	genieApi.put('/genies/payloads/' + b.id, null, function(e,r,b){

		if (e){
			console.error(e);
			process.exit(1);
		}

		console.log('payload activation http statusCode', r.statusCode);

	});

});