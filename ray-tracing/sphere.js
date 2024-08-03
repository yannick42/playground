import { Hittable } from './hittable.js';

function get_sphere_uv(p) {
    // p: a given point on the sphere of radius one, centered at the origin.
    // u: returned value [0,1] of angle around the Y axis from X=-1.
    // v: returned value [0,1] of angle from Y=-1 to Y=+1.
    //     <1 0 0> yields <0.50 0.50>       <-1  0  0> yields <0.00 0.50>
    //     <0 1 0> yields <0.50 1.00>       < 0 -1  0> yields <0.50 0.00>
    //     <0 0 1> yields <0.25 0.50>       < 0  0 -1> yields <0.75 0.50>

    const theta = Math.acos(-p.y);
    const phi = Math.atan2(-p.z, p.x) + Math.PI;

    let u = phi / (2*Math.PI);
    let v = theta / Math.PI;
    return [u, v]
}

export class Sphere extends Hittable {

    center;
    radius;

    material;

    constructor(center, radius, material) {
        super();
        this.center = center;
        this.radius = radius;
        this.material = material;
    }

    hit(ray, rayInterval, record /*in/out*/) {

        const oc = this.center.sub(ray.origin);
        
        /*
        const a = ray.direction.dot(r.direction);
        const b = ray.direction.dot(oc).mul(-2);
        const c = oc.dot(oc) - this.radius * this.radius;
        const discriminant = b*b - 4*a*c;
        */

        // optimization
        const a = ray.direction.lengthSquared();
        const h = ray.direction.dot(oc);
        const c = oc.lengthSquared() - this.radius * this.radius;
        const discriminant = h*h - a*c;

        //console.log(h, a, c, discriminant)

        if (discriminant < 0) {
            return [false, null]; // no intersection between this ray and the sphere
        }

        const sqrtd = Math.sqrt(discriminant);

        // find the nearest root that lies in the acceptable range.
        let root = (h - sqrtd) / a;
        if (! rayInterval.surrounds(root)) {
            root = (h + sqrtd) / a;
            if (! rayInterval.surrounds(root)) {
                return [false, null];
            }
        }


        //
        // fill hit record information
        //
        record.t = root;
        record.p = ray.at(record.t);
        
        // surface side determination
        const outwardNormal = record.p.sub(this.center).mul(1 / this.radius);
        record.setFaceNormal(ray, outwardNormal);

        let [u, v] = get_sphere_uv(outwardNormal);
        record.material = this.material; // 
        record.u = u;
        record.v = v;

        return [true, record];
    }
    
}