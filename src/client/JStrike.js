import * as constants from '../const';
import Process from '../core/Process';
import Engine from './Engine';
import SocketHandler from './handlers/SocketHandler';

class JStrike extends Process {

	constructor(io, serverState) {
		super();

		this.socketHandler = new SocketHandler(io);
		this.engine = new Engine(this.socketHandler, serverState.config);
	}

	start() {
		document.body.innerHTML += `
			<div id="jstrike">
				<div id="loader">
					<div id="loader-bar">
						<div id="loader-pc"></div>
					</div>
				</div>
				<div id="menu">
					<div id="menu-container">
						<b id="menu-continue">CONTINUE</b>
						<b id="menu-setting">SETTINGS</b>
						<b id="menu-exit">EXIT</b>
					</div>
				</div>
			</div>`;
		this.menu = document.getElementById('menu');
		this.menuContinue = document.getElementById('menu-continue');
		this.menuSettings = document.getElementById('menu-settings');
		this.menuExit = document.getElementById('menu-exit');

		this.initClient();
	}

	kill() {
		this.engine.kill();
		document.getElementById('jstrike').remove();
	}

	input(e) {
		/* 1 = down, 0 = up */
		let direction = (e.type == 'keydown' || e.type == 'keypress') ? 1 : 0;
		let filter = [
			constants.KEY_W,
			constants.KEY_A,
			constants.KEY_S,
			constants.KEY_D,
			constants.KEY_SPACE,
			49,
			50
		];

		if (filter.indexOf(e.keyCode) >= 0)
			this.engine.input(e.keyCode, direction);
	}

	initClient() {
		this.engine.init();

		/* Menu continue listener */
		this.menuContinue.addEventListener('click', () => {
			this.menu.style.display = 'none';
			this.engine.requestPointerLock();
		}, false);
		/* Menu exit listener */
		this.menuExit.addEventListener('click', (e) => {
			this.socketHandler.disconnecting();
			this.interrupt({type: 'killMe'})
		}, false);
	}
}

export default JStrike;
