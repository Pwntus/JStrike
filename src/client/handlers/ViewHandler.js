import * as THREE from 'three';

class ViewHandler {

	constructor() {
		this.gameView = new THREE.Scene;
		this.playerView = new THREE.Scene;
	}

	addToView(view, object) {
		switch (view) {
			case 'game':
				this.gameView.add(object);
			break;
			case 'player':
				this.playerView.add(object);
			break;
			default:
				console.warn('ViewHandler::addToView Unknown view.');
		}
	}

	getObjects(view) {
		switch (view) {
			case 'game':
				return this.gameView.children;
			break;
			case 'player':
				return this.playerView.children;
			break;
			default:
				return null;
		}
	}
}

export default ViewHandler;
