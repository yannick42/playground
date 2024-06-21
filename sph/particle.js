
export class Particle {
	x = 0;
	y = 0;
	vx = 0;
	vy = 0;
	collided = false;
	density = 0.01;
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
		// random velocity vector in x and y directions
		this.vx = (Math.random() - 0.5)*5;
		this.vy = (Math.random() - 0.5)*5;
	}
}
