const { Pxls } = require('@blankparenthesis/pxlsspace');
const axios = require('axios');
const sharp = require('sharp');

const pxls = new Pxls({
	site: process.env.SITE,
});

pxls.init = () => {
	pxls.connect().then(() => {
		console.log('Connected to Pxls!');
	});
};

pxls.info = async () => {
	const info = await axios.get(`https://${process.env.SITE}/info`, { responseType: 'json' });
	return info.data;
};

pxls.ping = async () => {
	const now = Date.now();
	pxls.ws.ping();
	return new Promise((resolve) => {
		pxls.ws.once('pong', () => {
			resolve({ miliseconds: Date.now() - now });
		});
	});
};

pxls.getCanvas = async () => {
	try {
		return await sharp(Buffer.from(pxls.canvas.data.deindex(pxls.palette)), { 'raw': {
			'width': pxls.canvas.width,
			'height': pxls.canvas.height,
			'channels': 4,
		} }).png().toBuffer();
	} catch {
		return null;
	}
};

module.exports = pxls;