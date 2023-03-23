const place = require('../handlers/place');

module.exports = {
	name: 'place',
	type: 'get',
	async execute(req, res) {
		res.contentType('image/png');
		res.send(await place.getCanvas());
	},
};