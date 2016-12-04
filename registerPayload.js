const config = require('./config'); 
const genieApi = require('genie.apiclient');
genieApi.config(config.api);

var payload = {

	name: {
		value: 'Giphy Genie'
	},

	description: {
		value: 'Type /giphy then anything!'
	},

	permissions: ['genie/global', 'group/read/messages'],
	availability: '*',
	subscriptions: '*',

	configure_url: config.url + '/genie_profile',

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

		fields: [
		//a simple input field
		 {
                type: "text",
                name: "name",
                label: {
                    value: "Label(name)",
                    alignment: "justify",
                    locale: {
                        ro_RO: "Nume"
                    }
                },
                sub_label: {
                    value: 'sublabel thingy',
                    locale: {
                        ro_RO: 'important'
                    },
                    alignment: 'center',
                },
                placeholder: {
                    value: 'placeholder thingy',
                    locale: {
                        ro_RO: 'Cum te cheama?'
                    }
                },
                validation: {
                    required: true,
                    min_length: 5,
                    max_length: 25,
                    regex: {
                        value: '/^[0-9a-z]*$/i',
                        label: {
                            value: 'Only alphanumeric characters',
                            locale: {
                                ro_RO: 'Doar caractere alfa-numerice!'
                            }
                        }
                    }
                }
            },

		],

		profile: {
			type: 'profile',
			header: 'header_image',
			form: {
				fields: [
					'name',
				],
			},
		}

	}

}

//let's register this payload
genieApi.post('/genies/payloads', payload, function(e,r,b){
	if (e){
		console.error(e);
		process.exit(1);
	}
	console.log(r.body);
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
                console.log(r.body);
		console.log('payload activation http statusCode', r.statusCode, (b ? b : ''));

	});

});
