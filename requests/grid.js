const sharp = require('sharp');
const grid = require('../handlers/grid');

module.exports = {
	name: 'grid',
	type: 'post',
	async execute(req, res) {
		const sheets = req.query.sheets ? req.query.sheets : false;

		if (req.body.x === undefined || req.body.x === null) return res.sendStatus(400);
		if (req.body.y === undefined || req.body.y === null) return res.sendStatus(400);
		if (req.file === undefined || req.file === null) return res.sendStatus(400);

		const offsetX = parseInt(req.body.x);
		const offsetY = parseInt(req.body.y);

		if (!Number.isInteger(offsetX)) return res.sendStatus(400);
		if (!Number.isInteger(offsetY)) return res.sendStatus(400);

		const input = await sharp(req.file.buffer);
		const inputMetadata = await input.metadata();
		const inputWidth = inputMetadata.width;
		const inputHeight = inputMetadata.height;

		if (offsetX < 0 || offsetX + inputWidth > 9999) return res.sendStatus(400);
		if (offsetY < 0 || offsetY + inputHeight > 9999) return res.sendStatus(400);

		if (sheets) {
			const sheet = await grid.createSpreadsheet(offsetX, offsetY, inputWidth, inputHeight, input);
			res.send({
				sheet: sheet,
			});
		} else {
			const image = await grid.createImage(offsetX, offsetY, inputWidth, inputHeight, input);

			res.contentType('image/png');
			res.send(image);
		}
	},
};