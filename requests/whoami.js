const axios = require('axios');
const database = require('../handlers/database');

module.exports = {
	name: 'whoami',
	type: 'get',
	async execute(req, res) {
		const token = req.cookies['pxls-token'];
		if (token === null && token === undefined) return res.status(400);
		const id = parseInt(token.split('|')[0]);
		let account = await database.getAccount(id);
		if (account === null) {
			const whoami = await axios.get(`https://${process.env.SITE}/whoami`, {
				responseType: 'json',
				headers: {
					Cookie: `pxls-token=${token};`,
				},
			});
			await database.setAccount(id, { pxls: whoami.data });
			account = {
				pxls: whoami.data,
			};
		}
		if (account._id !== null && account._id !== undefined) delete account._id;
		if (account.discord !== null && account.discord !== undefined && account.discord.token !== null && account.discord.token !== undefined) delete account.discord.token;
		res.status(200).json(account);
	},
};