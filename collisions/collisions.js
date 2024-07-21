
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { Ball } from './ball.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const   NB_BALLS = 30,
        MIN_MASS = 0.5,
        MAX_MASS = 10,
        COLORS = ['a30015', 'BD2D87', 'D664BE', 'DF99F0', 'B191FF'],
        DT = 0.33;

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    redraw();
}

let balls = [];
let reqId;

function redraw() {

    balls = []; // remove previous balls

    // balls creation
    for(let i = 0; i < NB_BALLS; i++) {
        //const radius = randInt(MIN_RADIUS, MAX_RADIUS);
        const ball = new Ball();
        ball.mass = randInt(MIN_MASS, MAX_MASS);
        ball.radius = Math.sqrt(ball.mass) * 10;
        ball.id = balls.length + 1;
        ball.color = COLORS[ball.id % COLORS.length];

        // avoid initial collision
        do {
            ball.position.x = randInt(ball.radius, canvas.width - ball.radius);
            ball.position.y = randInt(ball.radius, canvas.height - ball.radius);
        } while(balls.some(b => ball.collide(b))); // O(n) ...

        balls.push(ball);
    }
 
    // draw them
    balls.forEach(ball => ball.draw(ctx));

    if(reqId) {
        window.cancelAnimationFrame(reqId)
    }
    reqId = window.requestAnimationFrame(loop)

}

function loop() {
    setUpCanvas(ctx, canvas.width, canvas.height, 'ghostwhite');

    // check for collisions
        // momemtum = mass x velocity
        // kinetic energy = 1/2 mass x |velocity|²

        // m_a v_a + m_b v_b = m_a v_a' + m_b v_b' (conservation of momentum)
        // 1/2 m_a |v_a|² + 1/2 m_b |v_b|² = 1/2 m_a |v_a'|² + 1/2 m_b |v_b'|² (conservation of kinetic energy)

        // line of impact (between the center of the 2 colliding particles)
    
    for(let i = 0; i < balls.length; i++) {
        for(let j = i + 1; j < balls.length; j++) {

            const b1 = balls[i];
            const b2 = balls[j];

            if(b1.collide(b2)) {
                const mSum = b1.mass + b2.mass;

                const lineOfImpact = b2.position.sub(b1.position);
                const d = lineOfImpact.mag();
                const vDiff = b2.velocity.sub(b1.velocity);
                
                const numA = 2 * b2.mass * vDiff.dot(lineOfImpact);
                const den = mSum * d * d;

                const deltaVA = lineOfImpact.mul(numA / den);
                b1.velocity = b1.velocity.add(deltaVA)

                const numB = 2 * b1.mass * vDiff.mul(-1).dot(lineOfImpact.mul(-1));
                const deltaVB = lineOfImpact.mul(-1 * numB / den);
                b2.velocity = b2.velocity.add(deltaVB)
            }
        }
    }

    // draw them
    balls.forEach(ball => ball.draw(ctx));
    // move
    balls.forEach(ball => ball.step(DT, canvas.width, canvas.height));

    // loop
    reqId = window.requestAnimationFrame(loop);
}



main();
