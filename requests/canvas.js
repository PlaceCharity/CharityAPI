const pxls = require('../handlers/pxls');

module.exports = {
	name: 'canvas',
	type: 'get',
	async execute(req, res) {
		res.contentType('image/png');
		res.send(await pxls.getCanvas());
	},
};