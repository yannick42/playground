
export class Car {
	
	name = '?';
	speed;	// instant speed
	current_edge;
	color;
	offset;
	size;
	dest;
	//colors = ["green", "orange", "blue", "purple", "teal", "darkorange", "cyan"];
	
	constructor(name) {
		this.name = name;
		this.speed = Math.random() + 0.5;
		this.color = '#' + Math.floor(Math.random()*16777215).toString(16);
		//this.color = this.colors[Math.floor((Math.random() * this.colors.length) + 1)];
		this.offset = Math.random();
		this.size = Math.floor(Math.random() * 2.5);
		this.dest = null;
	}

	setEdge(edge) {
		this.current_edge = edge;
	}
	
}
