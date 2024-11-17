import { drawPointAt } from '../common/canvas.helper.js';
import { randFloat} from '../common/common.helper.js';
import { Vector2D } from '../common/vector2D.js';

export class Ball {
    x;
    y;
    position;
    velocity;
    mass;
    radius;
    id;
    color;
    constructor(x=0, y=0, r=1) {
        this.position = new Vector2D(x, y);
        this.radius = r;
        this.velocity = new Vector2D(randFloat(-2, 2), randFloat(-2, 2));
    }

    draw(ctx) {
        drawPointAt(ctx, this.position.x, this.position.y, this.radius, '#' + this.color);
    }

    step(DT, width, height) {
        this.position = this.position.add(this.velocity.mul(DT));
        //console.log(this.position)

        if(this.position.x < this.radius) this.velocity.x *= -1;
        if(this.position.y < this.radius) this.velocity.y *= -1;
        if(this.position.x + this.radius > width) this.velocity.x *= -1;
        if(this.position.y + this.radius > height) this.velocity.y *= -1;

    }

    collide(ball) {
        const dist = ball.position.sub(this.position).mag();
        return dist <= this.radius + ball.radius;
    }
}
