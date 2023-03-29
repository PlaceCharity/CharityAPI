const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
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
	async createSpreadsheet(offsetX, offsetY, width, height, input) {
		const image = await input.raw().toBuffer();

		const rows = [];

		for (let y = 0; y < height; y++) {
			rows.push({ 'values': [] });
			for (let x = 0; x < width; x++) {
				const cell = {
					'userEnteredValue': {
						'stringValue': '',
					},
				};

				const idx = (y * width + x) * 4;
				if (image[idx + 3] === 0) {
					rows[y].values.push(cell);
					continue;
				}

				const r = image[idx];
				const g = image[idx + 1];
				const b = image[idx + 2];

				const uicolors = [r / 255, g / 255, b / 255];
				const c = uicolors.map((col) => {
					if (col <= 0.03928) {
						return col / 12.92;
					}
					return Math.pow((col + 0.055) / 1.055, 2.4);
				});
				const L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
				const textColor = (L > 0.179) ? { 'red': 0, 'green': 0, 'blue': 0 } : { 'red': 1, 'green': 1, 'blue': 1 };

				const coordX = (x + offsetX).toString();
				const coordY = (y + offsetY).toString();

				cell.userEnteredValue = { 'stringValue': `X: ${coordX}\nY: ${coordY}` };
				cell.userEnteredFormat = {
					'backgroundColorStyle': {
						'rgbColor': {
							'red': r / 255,
							'green': g / 255,
							'blue': b / 255,
						},
					},
					'textFormat': {
						'foregroundColorStyle': {
							'rgbColor': textColor,
						},
					},
					'horizontalAlignment': 2,
					'verticalAlignment': 2,
				};
				rows[y].values.push(cell);
			}
		}

		const auth = new GoogleAuth({
			scopes: [
				'https://www.googleapis.com/auth/spreadsheets',
				'https://www.googleapis.com/auth/drive',
			],
		});

		const drive = google.drive({ version: 'v3', auth });
		const sheets = google.sheets({ version: 'v4', auth });

		const spreadsheet = await sheets.spreadsheets.create({
			resource: {
				properties: {
					title: 'Template',
				},
			},
			fields: 'spreadsheetId',
		});
		const spreadsheetId = spreadsheet.data.spreadsheetId;
		drive.permissions.create({ fileId: spreadsheetId, resource: { 'role': 'reader', 'type': 'anyone' } }, (error) => {
			if (error) return;
		});

		sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			resource: {
				requests: [
					{
						updateDimensionProperties: {
							'properties': {
								'pixelSize': 50,
							},
							'fields': '*',
							range: {
								'sheetId': 0,
								'dimension': 1,
							},
						},
					},
					{
						updateDimensionProperties: {
							'properties': {
								'pixelSize': 50,
							},
							'fields': '*',
							range: {
								'sheetId': 0,
								'dimension': 2,
							},
						},
					},
					{
						updateSheetProperties: {
							'properties': {
								'sheetId': 0,
								'title': 'Template',
								'gridProperties': {
									'rowCount': height,
									'columnCount': width,
								},
							},
							'fields': '*',
						},
					},
					{
						updateCells: {
							'rows': rows,
							'fields': '*',
							'start': {
								'sheetId': 0,
								'rowIndex': 0,
								'columnIndex': 0,
							},
						},
					},
				],
			},
		});

		return `https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/view?rm=minimal`;
	},
	async createImage(offsetX, offsetY, inputWidth, inputHeight, input) {
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

		return await output.png().toBuffer();
	},
};