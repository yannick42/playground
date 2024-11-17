
import { Vector2D } from '../common/vector2D.js';

export const NB_VERTICES = 50;

/**
 * a drop "of paint" (immiscible / incompressible)
 */
export class Drop {

    constructor(centerX, centerY, r)
    {
        this.x = centerX;
        this.y = centerY;
        this.r = r; // radius

        this.center = new Vector2D(this.x, this.y);

        //
        // Create a list of vertices forming this new circular drop (but not circular for long...)
        // ...using angle + polar to cartesian coordinates
        //
        this.vertices2D = []; // envelope/hull of the drop
        const angle = 2 * Math.PI / NB_VERTICES;
        for(let n = 0; n < NB_VERTICES; n++) {
            this.vertices2D.push(
                new Vector2D(
                    this.x + this.r * Math.cos(n * angle), // x component
                    this.y + this.r * Math.sin(n * angle) // y component
                )
            );
        }
    }

    /**
     * See : https://people.csail.mit.edu/jaffer/Marbling/Dropping-Paint
     * 
     * - where 'newDrop' argument is "C" in the given formula
     */
    marbledBy(newDrop)
    {
        // local function
        const move_P = (P, C) => {

            //
            // Compute each vertex displacement due to the new drop
            // so as to have an effect that looks "immiscible" and "incompressible"... (the drop keep its surface ?!)
            //
            // Formula "new P" = C + (P - C) * sqrt( 1 + r² / |P - C|² )
            //
            // C = new drop's center, P = current vertex of this drop (to move)
            //

            const P_minus_C = P.sub(C.center);
            const m_ = P_minus_C.mag();
            const sqrt = Math.sqrt(
                1
                + Math.pow(this.r, 2) / Math.pow(m_, 2)
            );

            // Explanation:
            // - a drop vertex move faster if it is closer to the new drop center
            // - ...?

            const newVertexPosition = C.center.add(
                P_minus_C.mul(sqrt)
            );
            return newVertexPosition;
        }

        // for each drop vertices (+ its center too ?!?)
        this.vertices2D = this.vertices2D.map(P => move_P(P, newDrop));
        this.center = move_P(this.center, newDrop);
    }
}
