import * as constants from '../const';
import * as THREE from 'three';
import PointerLockControls from '../lib/PointerLockControls';

class Player {

	constructor() {
		this.graphicsHandler, this.controls;

		this.velocity = new THREE.Vector3;
		this.height = 45;
		this.weight = 85;
		this.speed = 25;
		this.friction = 10;
		this.jumpVelocity = 300;

		this.airborne = false;
		this.moving = false;
		this.aiming = false;
		this.shooting = false;
		this.rayspace = 20;
		this.focus = false;

		this.delta;
		this.keys = {};
	}

	init(graphicsHandler) {
		this.graphicsHandler = graphicsHandler;
		this.controls = new PointerLockControls(this.graphicsHandler.camera);
	}

	setControls(state) {
		this.controls.enabled = state;
	}

	setPosition(pos) {
		this.controls.getObject().position.copy(pos);
	}

	getPosition() {
		return this.controls.getObject().position;
	}

	getDirection() {
		return this.controls.getDirection(new THREE.Vector3);
	}

	setKey(key, direction) {
		this.keys[key] = direction;

		switch (key) {
			case constants.MOUSE_RIGHT:
				this.aiming = direction;
				this.graphicsHandler.zoom(this.aiming);
			break;
			case constants.MOUSE_LEFT:
				this.shooting = direction;
			break;
		}
	}

	setFocus(state) {
		this.focus = state;
	}

	isFocused() {
		return this.focus;
	}

	isJumping() {
		return (this.keys[constants.KEY_SPACE] > 0) && !this.airborne;
	}

	jump() {
		this.velocity.y += this.jumpVelocity;
		this.airborne = true;
	}

	setVelocity() {
		let speed = (this.aiming) ? 50 : 100;
		let delta_speed = speed * this.speed * this.delta;
		this.velocity.z -= (this.keys[constants.KEY_W]) ? delta_speed : 0;
		this.velocity.x -= (this.keys[constants.KEY_A]) ? delta_speed : 0;
		this.velocity.z += (this.keys[constants.KEY_S]) ? delta_speed : 0;
		this.velocity.x += (this.keys[constants.KEY_D]) ? delta_speed : 0;
	}

	setFriction() {
		this.velocity.x -= this.velocity.x * this.friction * this.delta;
		this.velocity.z -= this.velocity.z * this.friction * this.delta;
		this.velocity.y -= (this.airborne) ? 9.8 * this.weight * this.delta : 0;
	}

	translate() {
		this.controls.getObject().translateX(this.velocity.x * this.delta);
		this.controls.getObject().translateY(this.velocity.y * this.delta);
		this.controls.getObject().translateZ(this.velocity.z * this.delta);
	}

	detectCollisions(objects) {
		let rayHits, actualDist;
		let raycaster = new THREE.Raycaster;
		raycaster.ray.origin.copy(this.controls.getObject().position);

		/* Down */
		raycaster.ray.direction.set(0, -1, 0);
		rayHits = raycaster.intersectObjects(objects, true);

		if ((rayHits.length > 0) && (rayHits[0].face.normal.y > 0)) {
			actualDist = Math.abs(rayHits[0].distance);

			/* Falling down */
			if((this.velocity.y <= 0) && (actualDist < this.height)) {
				this.controls.getObject().position.y += this.height - actualDist;
				this.velocity.y = 0;
				this.airborne = false;

			/* Dropping down */
			} else if ((this.velocity.y == 0) && (actualDist > this.height )) {
				if (rayHits[0].face.normal.y != 1 && actualDist < this.height + 5) {
					this.controls.getObject().position.y -= actualDist - this.height;
				} else {
					this.airborne = true;
				}
			}
		}

		let checkRay = (axis, dir) => {
			rayHits = raycaster.intersectObjects(objects, true);
			if(rayHits.length > 0) {
				actualDist = Math.abs(rayHits[0].distance);

				if(actualDist < this.rayspace) {
					if (axis > 0) {
						this.controls.getObject().position.x += (this.rayspace - actualDist) * dir;
					} else {
						this.controls.getObject().position.z += (this.rayspace - actualDist) * dir;
					}
				}
			}
		};

		/* If not moving, don't cast rays */
		if (this.velocity.length() < constants.NULL_VELOCITY) return;
		/* Ray origin from half player height */
		raycaster.ray.origin.y -= this.height / 2;
		/* Right */
		raycaster.ray.direction.set(1, 0, 0);	checkRay(1, -1);
		/* Left */
		raycaster.ray.direction.set(-1, 0, 0);	checkRay(1, 1);
		/* Front */
		raycaster.ray.direction.set(0, 0, -1);	checkRay(0, 1);
		/* Back */
		raycaster.ray.direction.set(0, 0, 1);	checkRay(0, -1);
	}

	animate(delta) {
		if (!this.isFocused()) return;

		this.delta = delta;
		if (this.isJumping()) {
			this.jump();
		}
		this.setVelocity();
		this.setFriction();
		this.detectCollisions(this.graphicsHandler.getObjects('game'));
		this.translate();
	}
}

export default Player;
