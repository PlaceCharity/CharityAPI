require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const fs = require('fs');
const pxls = require('./handlers/pxls');
const place = require('./handlers/place');

const app = express();

app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.ALLOW_ORIGIN }));

const requestFiles = fs.readdirSync('./requests').filter(file => file.endsWith('.js'));

const getRequests = {};
const postRequests = {};
const putRequests = {};
const patchRequests = {};
const deleteRequests = {};

for (const file of requestFiles) {
	const request = require(`./requests/${file}`);
	if (request.type === 'get') getRequests[request.name] = request;
	if (request.type === 'post') postRequests[request.name] = request;
	if (request.type === 'put') putRequests[request.name] = request;
	if (request.type === 'patch') patchRequests[request.name] = request;
	if (request.type === 'delete') deleteRequests[request.name] = request;
}

app.get('/api/:request', async (req, res) => {
	if (Object.keys(getRequests).includes(req.params.request)) {
		try {
			await getRequests[req.params.request].execute(req, res);
		} catch (e) {
			res.status(500).send(e);
		}
	}
});

app.post('/api/:request', upload.single('image'), async (req, res) => {
	if (Object.keys(postRequests).includes(req.params.request)) {
		try {
			await postRequests[req.params.request].execute(req, res);
		} catch (e) {
			console.error(e);
			res.status(500).send(e);
		}
	}
});

app.listen(1677, () => {
	console.log('API listening on port 1677...');
	pxls.init();
	place.connect();
});