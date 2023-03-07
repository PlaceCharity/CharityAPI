const MongoClient = require('mongodb').MongoClient;

module.exports = {
	async getAccountByPxlsId(id) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const accounts = database.collection('accounts');

			const result = await accounts.findOne({
				'pxls.id': id,
			});

			return result;
		} finally {
			await mongo.close();
		}
	},
	async setAccountByPxlsId(id, setting) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const accounts = database.collection('accounts');

			const info = {
				pxls: {
					id: id,
				},
				...setting,
			};

			const exists = await accounts.findOne({
				'pxls.id': id,
			});

			if (exists) {
				const result = await accounts.updateOne({
					'pxls.id': id,
				}, {
					$set: info,
				});
				return result;
			} else {
				const result = await accounts.insertOne(info);
				return result;
			}
		} finally {
			await mongo.close();
		}
	},
	async getAccountByDiscordId(id) {
		const mongo = new MongoClient(process.env.DB, {
			useUnifiedTopology: true,
		});
		try {
			await mongo.connect();
			const database = mongo.db('charity');
			const accounts = database.collection('accounts');

			const result = await accounts.findOne({
				'discord.id': id,
			});

			return result;
		} finally {
			await mongo.close();
		}
	},
};