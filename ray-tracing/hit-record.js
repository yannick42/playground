
export class HitRecord {
    p;
    normal;
    material;
    t;
    u;
    v;
    frontFace;

    setFaceNormal(ray, outwardNormal) {
        // Sets the hit record normal vector.
        // NOTE: the parameter `outward_normal` is assumed to have unit length.

        // ray is outside the sphere ?
        this.frontFace = ray.direction.dot(outwardNormal) < 0;
        this.normal = this.frontFace ? outwardNormal : outwardNormal.mul(-1);
    }
}
