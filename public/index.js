const request = require('request');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const npmInfo = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json').toString()));

//default configuration
var config  = {
	apiUrl: 'https://api.blend.la',
	apiVersion: '0.0.1',
	hashType: 'sha256',
	clientTimeout: 3500,
	accessKey: null,
	accessSecret: null,
}

//adds proper headers and verification signature to the requests
function getHeaders(uri,method, data){

	var expiresAt = new Date(new Date().getTime() + 10000).toISOString();
	var tokenizeText = `${expiresAt}${method}${uri}`;
	if (data){
		tokenizeText = tokenizeText + JSON.stringify(data);
	}

	var signature = crypto.createHmac(config.hashType, config.accessSecret).update(tokenizeText).digest('base64');

	return {
		'User-Agent': 'genieApiClient (nodeJS) / ' + npmInfo.version,
		'Authorization' : `SignedRequest key="${config.accessKey}", algo="${config.hashType}", signature="${signature}", expiresAt="${expiresAt}"`,
		'ApiVersion' : config.apiVersion,
	}

}

//used to validate events for the blend api webhook events and app(client) requests
function isValidEventSignature(req, getSecretForKey){

	if (!req.headers.authorization && !req.query.blendKey){
		return false;
	}

	var expiresAt = null;
	var toSign = null;
	var receivedSignature = null;
	var hashType = 'sha256';
	var signKeyId = null;
	var signKeySecret = crypto.randomBytes(64).toString('hex');

	if (req.query.blendKey){
	
		signKeyId = req.query.blendKey;

		toSign = req.query.blendExpiresAt;
		receivedSignature = req.query.blendSignature;
		if (req.query.blendAlgo){
			hashType = req.query.blendAlgo;
		}

		expiresAt = req.query.blendExpiresAt;

		toSign = req.query.blendExpiresAt + req.method;

		var url = req.path;

		var keys = ['blendSignature', 'blendKey', 'blendExpiresAt', 'blendAlgo'];
		var n = 0;
		for (var k in req.query){

			if (keys.indexOf(k) == -1){
				url = url + (n == 0 ? '?': '&') + k + '=' + encodeURIComponent(req.query[k]);
			}

			n++;
		}

		toSign += url;


	} else {

	var resi = req.headers.authorization.match(/([a-z]*\=\".*?\")/ig);

	for (var i in resi){

		var item  = resi[i];
		var r = item.match(/([a-z]*)\=\"(.*?)\"/i);
		var key = r[1];
		var val = r[2];

		switch(key){

			case 'expiresAt':
			var expiresAt = val;
			break;

			case 'signature':
			var receivedSignature = val;
			break;

			case 'algo':
			var hashType = val;
			break;

			case 'key':
			var signSecret = config.accessSecret;
			if (val != config.accessKey){
				return false;
			}
			break;

		}


	}

  }

	if (!expiresAt || !receivedSignature || !hashType || !signSecret){
		return false;
	}

	var expired = (new Date().getTime() > Date.parse(expiresAt));

	if (expired){
		return false;
	}

	if (!toSign){
		toSign = `${expiresAt}${req.method}${req.url}`;
	}

	if (req.body){
		toSign = toSign + JSON.stringify(req.body);
	}

	var signature = crypto.createHmac(hashType, signSecret).update(toSign).digest('base64');
	if (signature != receivedSignature){
		return false;
	}

	return true;
}


var functions = {}

functions.config = function(){

	switch(arguments.length){
		case 1:
		for (var k in arguments[0]){
			config[k] = arguments[0][k];
		}
		break;

		case 2:
		config[arguments[0]] = arguments[1];
		break;

		default:
		throw new Error('Invalid coniguration options');
		break;
	}
}

functions.get = function(uri, cb){
	return request.get(config.apiUrl + uri, {headers: getHeaders(uri,'GET'), timeout: config.clientTimeout}, cb);
}

functions.delete = function(uri, postData, cb){
	return request.delete(config.apiUrl + uri, {headers: getHeaders(uri,'DELETE'), timeout: config.clientTimeout}, cb);
}

functions.post = function(uri, postData, cb){
	return request.post(config.apiUrl + uri, {json:(postData ? true : false), headers: getHeaders(uri,'POST', postData), body:postData, timeout:config.clientTimeout} , cb);
}

functions.put = function(uri, postData, cb){
	return request.put(config.apiUrl + uri, {json:(postData ? true: false), headers: getHeaders(uri,'PUT', postData), body:postData, timeout: config.clientTimeout} , cb);
}

functions.validateClientRequest = function(req, res, getSecretPerKey){
	var expiresAt = null;
	var toSign = null;
	var receivedSignature = null;
	var hashType = 'sha256';
	var signKeyId = null;
	var signKeySecret = crypto.randomBytes(64).toString('hex');		
}

functions.processEvent = function(url, req, res){

	if (!isValidEventSignature(req)){
		res.status(401).json({error: 'invalid signature'});
		return false;
	}

	//event confirmation maybe?
	if (!req.body || !req.body.event || !req.body.event.type){
		var hash = crypto.createHmac(config.hashType, config.accessSecret).update(url).digest('base64');
		res.json({signature:hash, algo: config.hashType});
	}

	res.status(200).end();

	return req.body;
}

module.exports = functions;
