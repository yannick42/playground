import { Material } from '../material.js';
import { Ray } from '../ray.js';
import { Vec3 } from '../vec3.js';

function reflect(v, n) {
    return v.sub(n.mul(2 * v.dot(n)));
}

function refract(uv, n, etaIOverEtaT) {
    const cosTheta = Math.min(uv.mul(-1).dot(n), 1.0);

    const rOutPerp =  (uv.add(n.mul(cosTheta))).mul(etaIOverEtaT);
    const rOutParallel = n.mul(-Math.sqrt(Math.abs(1.0 - rOutPerp.lengthSquared())));

    return rOutPerp.add(rOutParallel);
}

export class Dielectric extends Material {

    refractionIndex;

    constructor(refractionIndex) {
        super();
        this.refractionIndex = refractionIndex;
    }

    scatter(rayIn, record) {
        const attenuation = new Vec3(1.0, 1.0, 1.0);

        const ri = record.frontFace ? 1 / this.refractionIndex : this.refractionIndex;

        const unitDirection = rayIn.direction.unit();

        const cosTheta = Math.min(unitDirection.mul(-1).dot(record.normal), 1.0);
        const sinTheta = Math.sqrt(1 - cosTheta*cosTheta);

        const cannotRefract = this.refractionIndex * sinTheta > 1;

        let direction;

        if(cannotRefract) {
            const reflected = reflect(unitDirection, record.normal);
            direction = reflected;
        } else {
            const refracted = refract(unitDirection, record.normal, ri);
            direction = refracted;
        }

        const scatteredRay = new Ray(record.p /*origin*/, direction);

        return [true, attenuation, scatteredRay];

    }
}
