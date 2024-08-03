import { Material } from '../material.js';
import { Ray } from '../ray.js';
import { Vec3 } from '../vec3.js';

function random_in_unit_sphere() {
    while (true) {
        const p = new Vec3(
            2 * (Math.random() - 0.5),
            2 * (Math.random() - 0.5),
            2 * (Math.random() - 0.5)
        )
        if (p.lengthSquared() < 1)
            return p;
    }
}


function random_unit_vector() {
    return random_in_unit_sphere().unit();
}

export class Lambertian extends Material {

    albedo; // Vec3 (color)

    constructor(albedo) {
        super();
        this.albedo = albedo;
    }

    scatter(rayIn, record) {
        const scatterDirection = record.normal.add(random_unit_vector());

        // catch degenerate scatter direction
        if (scatterDirection.nearZero()) {
            scatterDirection = record.normal;
        }
        
        const scatteredRay = new Ray(record.p, scatterDirection);
        const attenuation = this.albedo;

        return [true, attenuation, scatteredRay];
    }
}
