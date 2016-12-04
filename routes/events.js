module.exports = function(router) {
	router.all('/events', function(req, res) {

		var genieApi = req.app.get('genieApi');
		var currentUrl = req.app.get('config').url + '/events';
		var eventData = genieApi.processEvent(currentUrl, req, res, function(err,eventData) {

			if (err) {
				return console.error(err);
			}

			//no event or other invalid data
			if (!eventData || !eventData.event){
				return;
			}

			switch(eventData.event.type) {

				case 'subscription/success':
					console.log('The genie has succesfully registered the webhook url and is going to receive events from the api');
					break;

				case 'genie/init':
					console.log('The genie is current being added to a group', eventData);
					handleInit(req, eventData);
					break;

				case 'genie/added':
					console.log('The genie has been sucesfully added to the group', eventData);
					handleAdded(req, eventData);
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
	});
	return router;
}

function handleInit(req, eventData) {
	saveToRedis(req, eventData);
}

function handleAdded(req, eventData) {
	//we can now send messages to the group, let's send a custom display unit message
	var messageData = {
		mentions: [],
		text: 'Thanks for adding me to the group',
		display_unit: 'fancy',
		payload: {
			collection_items : [
				{
					type: 'item',
					width: 'medium',
					background_color: '#FFFFFF',
					border: true,
					on_tap: 'https://reddit.com',
					elements: [
						{
							type: 'image',
							image: {
								url: req.app.get('config').url + '/images/gif.gif',
								aspect_ratio: 1.33,
							},
						},

						{
							type: 'label',
							label: {
								value: "I'm here with",
							}
						}
					],
				}
			]
		},
	}

	for (var i in eventData.payload.members){
		var member = eventData.payload.members[i];
		messageData.mentions.push(member.id);		
		messageData.payload.collection_items[0].elements.push({type: 'label', label: {value: '%'+member.id+'%'}});
	}

	genieApi.post('/genies/groups/'+eventData.group.id+'/message', messageData, function(e,r,b){});
	saveToRedis(req, eventData);
}

function saveToRedis(req, eventData) {
	//store all members in redis as we need their id and key to authenticate them when they request anything directly from the genie
	for (var i in eventData.payload.members){
		var member = eventData.payload.members[i];
		req.app.get('redis').set('member_' + member.id, JSON.stringify(member));
	}
}
