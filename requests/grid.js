const sharp = require('sharp');

const numbers = {
	0: Buffer.from([
		0, 255, 255,
		255, 0, 255,
		255, 0, 255,
		255, 0, 255,
		255, 255, 0,
	]),
	1: Buffer.from([
		0, 255, 0,
		255, 255, 0,
		0, 255, 0,
		0, 255, 0,
		255, 255, 255,
	]),
	2: Buffer.from([
		255, 255, 0,
		0, 0, 255,
		0, 255, 0,
		255, 0, 0,
		255, 255, 255,
	]),
	3: Buffer.from([
		255, 255, 0,
		0, 0, 255,
		0, 255, 0,
		0, 0, 255,
		255, 255, 0,
	]),
	4: Buffer.from([
		0, 0, 255,
		0, 255, 255,
		255, 0, 255,
		255, 255, 255,
		0, 0, 255,
	]),
	5: Buffer.from([
		0, 255, 255,
		255, 0, 0,
		255, 255, 255,
		0, 0, 255,
		255, 255, 0,
	]),
	6: Buffer.from([
		0, 255, 255,
		255, 0, 0,
		255, 255, 0,
		255, 0, 255,
		255, 255, 255,
	]),
	7: Buffer.from([
		255, 255, 255,
		0, 0, 255,
		0, 0, 255,
		0, 255, 0,
		0, 255, 0,
	]),
	8: Buffer.from([
		0, 255, 255,
		255, 0, 255,
		255, 255, 255,
		255, 0, 255,
		255, 255, 0,
	]),
	9: Buffer.from([
		0, 255, 255,
		255, 0, 255,
		255, 255, 255,
		0, 0, 255,
		255, 255, 0,
	]),
};

module.exports = {
	name: 'grid',
	type: 'post',
	async execute(req, res) {
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

		const scaleFactor = 16;

		const scaledInput = input.resize({
			width: inputWidth * scaleFactor,
			kernel: 'nearest',
		});

		const outputBuffer = await scaledInput.raw().toBuffer();
		for (let i = 0; i < inputWidth * inputHeight * 4; i = i + 4) {
			const x = ((i / 4) % inputWidth) * scaleFactor;
			const y = Math.floor((i / 4) / inputWidth) * scaleFactor;
			const idx = (y * (inputWidth * scaleFactor) + x) * 4;
			const pixelColor = { r: outputBuffer[idx], g: outputBuffer[idx + 1], b: outputBuffer[idx + 2] };

			for (let j = 0; j < scaleFactor; j++) {
				const horizontalIdx = ((y + scaleFactor - 1) * (inputWidth * scaleFactor) + (x + j)) * 4;
				const verticalIdx = ((y + j) * (inputWidth * scaleFactor) + (x + scaleFactor - 1)) * 4;
				outputBuffer[horizontalIdx] = 150;
				outputBuffer[horizontalIdx + 1] = 150;
				outputBuffer[horizontalIdx + 2] = 150;
				outputBuffer[horizontalIdx + 3] = 255;
				outputBuffer[verticalIdx] = 150;
				outputBuffer[verticalIdx + 1] = 150;
				outputBuffer[verticalIdx + 2] = 150;
				outputBuffer[verticalIdx + 3] = 255;
			}

			if (outputBuffer[idx + 3] === 0) continue;

			const coordX = ((x / scaleFactor) + offsetX).toString();
			const coordY = ((y / scaleFactor) + offsetY).toString();

			const uicolors = [pixelColor.r / 255, pixelColor.g / 255, pixelColor.b / 255];
			const c = uicolors.map((col) => {
				if (col <= 0.03928) {
					return col / 12.92;
				}
				return Math.pow((col + 0.055) / 1.055, 2.4);
			});
			const L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
			const textColor = (L > 0.179) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };

			for (let j = 0; j < coordX.length; j++) {
				for (let numX = 0; numX < 3; numX++) {
					for (let numY = 0; numY < 5; numY++) {
						const idX = x + (scaleFactor - 4 - ((coordX.length - 1) * 4)) + (j * 4) + numX;
						const idY = y + numY;
						const xIdx = (idY * (inputWidth * scaleFactor) + idX) * 4;
						if (numbers[coordX.charAt(j)][numY * 3 + numX] === 255) {
							outputBuffer[xIdx + 0] = textColor.r;
							outputBuffer[xIdx + 1] = textColor.g;
							outputBuffer[xIdx + 2] = textColor.b;
						}
					}
				}
			}

			for (let j = 0; j < coordY.length; j++) {
				for (let numX = 0; numX < 3; numX++) {
					for (let numY = 0; numY < 5; numY++) {
						const idX = x + (scaleFactor - 4 - ((coordY.length - 1) * 4)) + (j * 4) + numX;
						const idY = y + numY + 6;
						const yIdx = (idY * (inputWidth * scaleFactor) + idX) * 4;
						if (numbers[coordY.charAt(j)][numY * 3 + numX] === 255) {
							outputBuffer[yIdx + 0] = textColor.r;
							outputBuffer[yIdx + 1] = textColor.g;
							outputBuffer[yIdx + 2] = textColor.b;
						}
					}
				}
			}
		}

		const output = await sharp(outputBuffer, {
			raw: {
				width: inputWidth * scaleFactor,
				height: inputHeight * scaleFactor,
				channels: 4,
			},
		}).extend({
			top: 1,
			left: 1,
			background: { r: 150, g: 150, b: 150, alpha: 255 },
		});

		res.contentType('image/png');
		res.send(await output.png().toBuffer());
	},
};