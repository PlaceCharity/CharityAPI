const axios = require('axios');
const database = require('../handlers/database');

module.exports = {
	name: 'auth',
	type: 'get',
	async execute(req, res) {
		if (req.query.code === null || req.query.code === undefined) {
			res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURI(process.env.AUTH_REDIRECT)}&response_type=code&scope=identify`);
		} else {
			const pxlsToken = req.cookies['pxls-token'];
			if (pxlsToken === null && pxlsToken === undefined) return res.redirect(process.env.AUTH_COMPLETE);
			const id = parseInt(pxlsToken.split('|')[0]);
			let account = await database.getAccount(id);
			if (account === null) {
				const whoami = await axios.get(`https://${process.env.SITE}/whoami`, {
					responseType: 'json',
					headers: {
						Cookie: `pxls-token=${token};`,
					},
				});
				account = {
					pxls: whoami.data,
				};
			}
			delete account._id;

			const token = await axios.post('https://discord.com/api/v10/oauth2/token', {
				'client_id': process.env.DISCORD_CLIENT_ID,
				'client_secret': process.env.DISCORD_CLIENT_SECRET,
				'grant_type': 'authorization_code',
				'code': req.query.code,
				'redirect_uri': process.env.AUTH_REDIRECT,
			}, {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
			account.discord = {};
			account.discord.token = token.data;
			const user = await axios.get('https://discord.com/api/v10/users/@me', {
				responseType: 'json',
				headers:{
					Authorization: `${token.data.token_type} ${token.data.access_token}`,
				},
			});
			account.discord.id = user.data.id;
			account.discord.username = user.data.username;
			account.discord.avatar = user.data.avatar;
			account.discord.discriminator = user.data.discriminator;
			await database.setAccount(id, account);
			res.redirect(process.env.AUTH_COMPLETE);
		}
	},
};