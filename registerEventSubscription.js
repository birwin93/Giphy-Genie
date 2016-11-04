const config = require('./config'); 
const genieApi = require('genie.apiclient');
genieApi.config(config.api);

genieApi.post('/genies/event_subscription', {'url': config.url + '/events'}, function(e,r,b){

	if (e){
		console.error(1);
		process.exit(1);
	}

	console.log('subscrition request done with http statusCode', r.statusCode);
});
