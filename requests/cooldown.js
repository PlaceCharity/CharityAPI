const { Pxls } = require('@blankparenthesis/pxlsspace');
const pxls = require('../handlers/pxls');

function cooldownMultiplier(cooldown, stack) {
	function sumUpToN(n) {
		let r = 0;
		for (let i = 0; i <= n; i++) {
			r += i;
		}
		return r;
	}
	if (stack === 0) return cooldown;
	return (cooldown * 3) * (1 + stack + sumUpToN(stack - 1));
}

module.exports = {
	name: 'cooldown',
	type: 'get',
	async execute(req, res) {
		const users = req.query.users ? parseInt(req.query.users) : pxls.users;
		const info = await pxls.info();
		const cooldown = Pxls.cooldownForUserCount(users, info.cooldownInfo.activityCooldown);
		const output = {
			users: users,
			multiplier: info.cooldownInfo.activityCooldown.multiplier,
			cooldown: [],
			totalCooldown: [],
		};
		for (let i = 0; i < 6; i++) {
			let totalCooldown = cooldownMultiplier(cooldown, i);
			let stackCooldown = i === 0 ? totalCooldown : totalCooldown - output.totalCooldown[i - 1].value;

			stackCooldown = {
				value: stackCooldown,
				display: {},
			};
			stackCooldown.display.hours = Math.floor(stackCooldown.value / 3600);
			stackCooldown.display.minutes = Math.floor((stackCooldown.value - (stackCooldown.display.hours * 3600)) / 60);
			stackCooldown.display.seconds = (stackCooldown.value - (stackCooldown.display.hours * 3600) - (stackCooldown.display.minutes * 60));
			output.cooldown.push(stackCooldown);
			totalCooldown = {
				value: totalCooldown,
				display: {},
			};
			totalCooldown.display.hours = Math.floor(totalCooldown.value / 3600);
			totalCooldown.display.minutes = Math.floor((totalCooldown.value - (totalCooldown.display.hours * 3600)) / 60);
			totalCooldown.display.seconds = (totalCooldown.value - (totalCooldown.display.hours * 3600) - (totalCooldown.display.minutes * 60));
			output.totalCooldown.push(totalCooldown);
		}
		res.send(output);
	},
};