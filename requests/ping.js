const pxls = require('../handlers/pxls');

module.exports = {
	name: 'ping',
	type: 'get',
	async execute(req, res) {
		res.send(await pxls.ping());
	},
};