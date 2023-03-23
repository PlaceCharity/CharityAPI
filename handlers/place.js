const axios = require('axios');
const sharp = require('sharp');
const WebSocket = require('ws');

let canvas;

module.exports = {
	async connect() {
		canvas = await sharp({
			create: {
				width: 2000,
				height: 2000,
				channels: 4,
				background: { r: 255, g: 255, b: 255, alpha: 1 },
			},
		}).png().toBuffer();

		const ws = new WebSocket(process.env.REDDIT_WS, {
			origin: process.env.WS_ORIGIN,
		});

		let pingTimeout = setTimeout(() => {
			ws.terminate();
		}, 30000);

		function heartbeat() {
			clearTimeout(pingTimeout);
			pingTimeout = setTimeout(() => {
				ws.terminate();
			}, 30000);
		}

		ws.on('open', () => {
			console.log('Websocket Connected.');
			heartbeat();
			ws.send(`{"type":"connection_init","payload":{"Authorization":"${process.env.REDDIT_AUTH}"}}`);
		});

		ws.on('message', function message(data) {
			if (JSON.parse(data).type === 'ka') return heartbeat();
			if (JSON.parse(data).type === 'connection_ack') {
				ws.send('{"id":"1","type":"start","payload":{"variables":{"input":{"channel":{"teamOwner":"AFD2022","category":"CONFIG"}}},"extensions":{},"operationName":"configuration","query":"subscription configuration($input: SubscribeInput!) {\\n  subscribe(input: $input) {\\n    id\\n    ... on BasicMessage {\\n      data {\\n        __typename\\n        ... on ConfigurationMessageData {\\n          colorPalette {\\n            colors {\\n              hex\\n              index\\n              __typename\\n            }\\n            __typename\\n          }\\n          canvasConfigurations {\\n            index\\n            dx\\n            dy\\n            __typename\\n          }\\n          canvasWidth\\n          canvasHeight\\n          __typename\\n        }\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n"}}');
				ws.send('{"id":"2","type":"start","payload":{"variables":{"input":{"channel":{"teamOwner":"AFD2022","category":"CANVAS","tag":"0"}}},"extensions":{},"operationName":"replace","query":"subscription replace($input: SubscribeInput!) {\\n  subscribe(input: $input) {\\n    id\\n    ... on BasicMessage {\\n      data {\\n        __typename\\n        ... on FullFrameMessageData {\\n          __typename\\n          name\\n          timestamp\\n        }\\n        ... on DiffFrameMessageData {\\n          __typename\\n          name\\n          currentTimestamp\\n          previousTimestamp\\n        }\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n"}}');
				ws.send('{"id":"3","type":"start","payload":{"variables":{"input":{"channel":{"teamOwner":"AFD2022","category":"CANVAS","tag":"1"}}},"extensions":{},"operationName":"replace","query":"subscription replace($input: SubscribeInput!) {\\n  subscribe(input: $input) {\\n    id\\n    ... on BasicMessage {\\n      data {\\n        __typename\\n        ... on FullFrameMessageData {\\n          __typename\\n          name\\n          timestamp\\n        }\\n        ... on DiffFrameMessageData {\\n          __typename\\n          name\\n          currentTimestamp\\n          previousTimestamp\\n        }\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n"}}');
				ws.send('{"id":"4","type":"start","payload":{"variables":{"input":{"channel":{"teamOwner":"AFD2022","category":"CANVAS","tag":"2"}}},"extensions":{},"operationName":"replace","query":"subscription replace($input: SubscribeInput!) {\\n  subscribe(input: $input) {\\n    id\\n    ... on BasicMessage {\\n      data {\\n        __typename\\n        ... on FullFrameMessageData {\\n          __typename\\n          name\\n          timestamp\\n        }\\n        ... on DiffFrameMessageData {\\n          __typename\\n          name\\n          currentTimestamp\\n          previousTimestamp\\n        }\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n"}}');
				ws.send('{"id":"5","type":"start","payload":{"variables":{"input":{"channel":{"teamOwner":"AFD2022","category":"CANVAS","tag":"3"}}},"extensions":{},"operationName":"replace","query":"subscription replace($input: SubscribeInput!) {\\n  subscribe(input: $input) {\\n    id\\n    ... on BasicMessage {\\n      data {\\n        __typename\\n        ... on FullFrameMessageData {\\n          __typename\\n          name\\n          timestamp\\n        }\\n        ... on DiffFrameMessageData {\\n          __typename\\n          name\\n          currentTimestamp\\n          previousTimestamp\\n        }\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n"}}');
				return;
			}
			if (JSON.parse(data).type === 'data') {
				const frameData = JSON.parse(data).payload.data.subscribe.data;
				if (frameData.__typename === 'FullFrameMessageData' || frameData.__typename === 'DiffFrameMessageData') {
					axios.get(frameData.name, { responseType: 'arraybuffer' }).then(async res => {
						if (JSON.parse(data).id === '2') canvas = await sharp(canvas).composite([{ input: res.data, top: 0, left: 0 }]).png().toBuffer();
						if (JSON.parse(data).id === '3') canvas = await sharp(canvas).composite([{ input: res.data, top: 0, left: 1000 }]).png().toBuffer();
						if (JSON.parse(data).id === '4') canvas = await sharp(canvas).composite([{ input: res.data, top: 1000, left: 0 }]).png().toBuffer();
						if (JSON.parse(data).id === '5') canvas = await sharp(canvas).composite([{ input: res.data, top: 1000, left: 1000 }]).png().toBuffer();
					}).catch(error => console.log(error));
				}
			}
		});

		ws.on('ping', heartbeat);

		ws.on('close', () => {
			clearTimeout(pingTimeout);
			console.log('Websocket Disconnected.');
			setTimeout(this.connect, 5000);
		});

		ws.on('error', console.error);
	},
	getCanvas() {
		return canvas;
	},
};