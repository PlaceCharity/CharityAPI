const database = require('../handlers/database');

module.exports = {
	name: 'whois',
	type: 'get',
	async execute(req, res) {
		if (req.query.discord === null || req.query.discord === undefined) return res.status(400).end();
		const account = await database.getAccountByDiscordId(req.query.discord);
		if (account === null || account === undefined) return res.status(204).end();
		if (account._id !== null && account._id !== undefined) delete account._id;
		if (account.discord !== null && account.discord !== undefined && account.discord.token !== null && account.discord.token !== undefined) delete account.discord.token;
		res.status(200).json(account);
	},
};