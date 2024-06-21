
export class Road {
	
	max_speed; // km/h
	length = 1;
	current_flow = 0;
	capacity;
	
	constructor(capacity, maxSpeed=130) {
		this.capacity = capacity;
		this.max_speed = maxSpeed;
	}
	
}
