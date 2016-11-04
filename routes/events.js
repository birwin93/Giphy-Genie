module.exports = function(router){


		//this route catches is the webhook where all the events from the Genie API are received.
		//there's no need to return anything to the blend api in this route
		router.all('/events', function(req, res) {

			var currentUrl = config.url + '/events';
			var eventData = req.app.get('genieApi').processEvent(currentUrl, req, res);

		     //no event or other invalid data
		     if (!eventData || eventData.event){
		     	return;
		     }

		     switch(eventData.event.type){

		     	case 'subscription/success':
		     	console.log('The genie has succesfully registered the webhook url and is going to receive events from the api');
		     	break;

		     	case 'genie/init':
		     	console.log('The genie is current being added to a group', eventData);
		     	break;


		     	case 'genie/added':
		     	console.log('The genie has been sucesfully added to the group', eventData);

		     	//we can now send messages to the group
		     	genieApi.post('/genies/groups/'+eventData.group.id+'/message', {text: 'Thanks for adding me to the group'}, function(e,r,b){});
		     	break;

		     	case 'genie/removed':
		     	console.log('The genie was removed from a group');
		     	break;

		     	case 'genie/canceled':
		     	console.log('Genie onboarding was canceled by the user trying to add the genie');
		     	break;

		     	case 'genie/muted':
		     	console.log('Genie was silenced by a user within a group the genie is in');
		     	break;

		     	case 'member/added':
		     	console.log('A member was added to a group the genie is in');

		     	//let's welcome this user within the group
		     	var body = {
		     		text: 'Hello and welcome to the group %'+eventData.payload.members[0].id+'%',
		     		mentions: [eventData.payload.members[0].id],
		     	}

		     	genieApi.post('/genies/groups/'+eventData.group.id+'/message', body, function(e,r,b){});
		     	break;

		     	case 'member/removed':
		     	console.log('A member was removed from a group the genie is in');
		     	break;

		     	case 'member/leave':
		     	console.log('A member left a group the genie is in');
		     	break;

		     	case 'group/removed':
		     	console.log('A group that had the genie was removed altogether');
		     	break;

		     }

		 });

return router;
}
