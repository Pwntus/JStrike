import * as constants from '../../const';
import * as THREE from 'three';
import * as TWEEN from 'tween.js';

class WeaponHandler {

	constructor() {
		this.assetHandler;
		this.primary, this.secondary = null;
		this.selected;

		this.shooting = 0;
		this.aiming = 0;
	}

	init(assetHandler, player) {
		this.assetHandler = assetHandler;
		this.player = player;
	}

	setKey(key, direction) {
		switch (key) {
			case constants.KEY_1:
				if (this.selected != this.primary)
					this.selectPrimary();
			break;
			case constants.KEY_2:
				if (this.selected != this.secondary)
					this.selectSecondary();
			break;
			case constants.MOUSE_LEFT:
				this.shooting = direction;
			break;
			case constants.MOUSE_RIGHT:
				if (this.aiming != direction)
					this.animateAim(direction);
				this.aiming = direction;
			break;
		}
	}

	setPrimary(weapon) {
		this.primary = this.assetHandler.getWeapon(weapon);
	}

	setSecondary(weapon) {
		this.secondary = this.assetHandler.getWeapon(weapon);
	}

	selectPrimary() {
		this.secondary.visible = false;
		this.primary.visible = true;
		this.selected = this.primary;
	}

	selectSecondary() {
		this.primary.visible = false;
		this.secondary.visible = true;
		this.selected = this.secondary;
	}

	positionGun(pos) {
		let dir = this.player.getDirection();

		let xDir = new THREE.Vector3;
		xDir.crossVectors(dir, new THREE.Vector3(0, 1, 0))
		.normalize()
		.multiplyScalar(pos.x);

		let yDir = new THREE.Vector3(0, 1, 0);
		yDir.multiplyScalar(pos.y);

		let zDir = dir;
		zDir.multiplyScalar(pos.z);

		let newPos = new THREE.Vector3;
		newPos.copy(this.player.getPosition());
		newPos.add(xDir);
		newPos.add(yDir);
		newPos.add(zDir);

		this.selected.position.copy(newPos);
	}

	animate(delta) {
		if (!this.animating) {
			let wc = constants.WEAPON[this.selected.name];
			let pos = (this.aiming) ? wc.pos.aiming : wc.pos.default;
			this.positionGun(pos);
		}

		var ray = new THREE.Ray();
		ray.set(
			this.player.getPosition(),
			this.player.getDirection()
		);
		this.selected.lookAt(ray.at(2000));
	}

	animateAim(direction) {
		if (this.animating) return;
		this.animating = true;

		let wc = constants.WEAPON[this.selected.name];
		var from = (direction > 0) ? wc.pos.default : wc.pos.aiming;
		var to = (direction > 0) ? wc.pos.aiming : wc.pos.default;
		from = Object.assign({}, from);
		to = Object.assign({}, to);

		let that = this;
		let t = new TWEEN.Tween(from).to(to, 50)
		.onUpdate(function() {
			that.positionGun({x: this.x, y: this.y, z: 0});
		})
		.onComplete(() => this.animating = false)
		.start();
	}
}

export default WeaponHandler;