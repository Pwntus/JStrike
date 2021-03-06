import * as constants from '../const';
import Process from '../core/Process';
import IO from 'socket.io-client';
import JStrike from '../client/JStrike';

class Shell extends Process {

	constructor() {
		super();

		/* Buffer holding the current input string */
		this.buffer = '';
		/* Boolean preventing multi-exec commands */
		this.executing = false;
		/* Socket instance when connected to a server */
		this.io = null;
		/* Server namespace used in shell */
		this.connected_server = '';
		/* Commands that should be executed over a socket */
		this.external_cmd = null;
	}

	start() {
		document.body.innerHTML += `
			<div id="shell">
				<ul><li id="shell-input">$ <b>&block;</b></li></ul>
			</div>`;
		this.exec('help');
	}

	pause() {
		super.pause();
		document.getElementById('shell').style.display = 'none';
	}

	continue() {
		super.continue();
		document.getElementById('shell').style.display = 'block';
	}

	input(e) {

		/* For keydown event, only listen for the backspace key.
		 * Listen for keypress events since we want to capture
		 * the key-character. Ignore every other event.
		 */
		if ((e.type == 'keydown' && e.keyCode != constants.KEY_BACKSPACE)
			|| e.type == 'keyup'
			|| e.type == 'mousedown'
			|| e.type == 'mouseup'
			|| this.executing)
			return; 

		switch (e.keyCode) {
			case constants.KEY_ENTER:
				this.exec(this.buffer);
			break;
			case constants.KEY_BACKSPACE:
				this.buffer = this.buffer.slice(0, -1);
			break;
			default:
				this.buffer += String.fromCharCode(e.charCode || e.keyCode);
		}

		document.getElementById('shell-input').innerHTML = `${this.connected_server}$ ${this.buffer}<b>&block;</b>`;
	}

	/* Hide input field.
	 * Used when waiting for an external
	 * cmd to get a response.
	 */
	hideInput() {
		this.executing = true;
		document.getElementById('shell-input').style.display = 'none';
	}

	/* Show input field.
	 * Add server IP as identity.
	 */
	showInput() {
		this.executing = false;
		document.getElementById('shell-input').innerHTML = `${this.connected_server}$<b>&block;</b>`;
		document.getElementById('shell-input').style.display = 'block';
	}

	/* Print every line in `str` to the terminal.
	 * If `id` is set, include server IP identity.
	 */
	out(str, id = false) {
		let list = document.getElementById('shell').lastElementChild;
		let lines = str.split('\n');

		for (let line of lines) {
			let element = document.createElement('li');
			element.innerHTML = id ? `${this.connected_server}$ ${line}` : line;
			list.insertBefore(element, list.lastElementChild);
		}

		/* Scroll to bottom */
		window.scrollTo(0, document.body.scrollHeight);
	}

	/* Execute a command.
	 * Check if command is in external-cmd list, if it is
	 * emit the command over the socket.
	 * If regular command, call appropriate function.
	 */
	exec(str) {
		this.buffer = '';

		/* Prevent multi-exec */
		if (this.executing) return;

		/* Shell like formatting */
		this.out(str, true);
		if (str == '') return;
		this.executing = true;

		/* Extract arguments */
		let argv = str.split(' ');

		/* If executing an external command and
		 * connected to a server, do a socket cmd.
		 */
		if (this.io && this.external_cmd.hasOwnProperty(argv[0])) {
			this.hideInput();
			this.io.emit('shell', {
				cmd: argv[0],
				argv: argv.slice(1)
			});
			return;
		}

		/* Executing local command */
		switch (argv[0]) {
			case 'clear': 		this.cmd_clear();			break;
			case 'help': 		this.cmd_help();			break;
			case 'disconnect': 	this.cmd_disconnect();		break;
			case 'connect': 	this.cmd_connect(argv[1]);	break;
			default:
				this.out(`Unknown command: '${argv[0]}'`);
				this.executing = false;
		}
	}

	/* Clear the terminal */
	cmd_clear() {
		let list = document.getElementById('shell').lastElementChild;
		let input = list.lastElementChild;
		list.innerHTML = input.outerHTML;
		this.executing = false;
	}

	cmd_help() {
		let str = `Available commands:
					<pre>	clear		- clear the screen</pre>
					<pre>	help		- display this help</pre>`;

		/* Display commands provided by external server */
		if (this.external_cmd) {
			for (let cmd in this.external_cmd) {
				str += `<pre>	${cmd}		- ${this.external_cmd[cmd]}</pre>`;
			}
			str += `<pre>	disconnect	- disconnect from the server</pre>`;
		} else {
			str += `<pre>	connect		- [IP] connect to a server</pre>`;
		}
		this.out(str +`\n`);
		this.executing = false;
	}

	cmd_disconnect() {
		if (!this.io) {
			this.out(`disconnect: not connected`);
			this.executing = false;
			return;
		}
		this.io.disconnect();
		this.io = null;
		this.connected_server = '';
		this.external_cmd = null;
		this.out(`disconnect: successful\n`);
		this.executing = false;
	}

	cmd_connect(server) {
		if (this.io) {
			this.out(`connect: already connected`);
			this.executing = false;
			return;
		}

		if (server == '' || server === undefined) {
			this.out(`connect: IP address required`);
			this.executing = false;
			return;
		}

		this.out(`connecting to ${server}`);
		this.setupSocket(server);
		this.hideInput();
	}

	setupSocket(server) {
		this.io = new IO(server, {
			'sync disconnect on unload': true
		});

		this.io.on('connect', () => {
			this.out(`connection successful!\n`);
			this.connected_server = server;
			this.showInput();
		});

		this.io.on('connect_error', data => {
			this.io.disconnect();
			this.io = null;
			this.connected_server = '';
			this.external_cmd = null;
			this.out(`failed to connect to ${server}\n`);
			this.showInput();
		});

		this.io.on('shell', (data) => this.shellHandler(data));
	}

	shellHandler(data) {
		switch(data.type) {
			case 'init':
				this.external_cmd = data.cmd;
			break;
			case 'exec':
				this.out(data.response +'\n');
				this.showInput();
			break;
			case 'join':
				this.out(`join: starting game '${data.response.config.name}'`);
				this.showInput();
				this.interrupt({
					type: 'startProcess',
					process: new JStrike(this.io, data.response)
				});
			break;
			default:
				console.warn('Got unknown response from server: '+ data.type);
		}
	}
}

export default Shell;
