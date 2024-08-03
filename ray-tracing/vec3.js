
export class Vec3 {

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(otherVector) {
        return new Vec3(
            this.x + otherVector.x,
            this.y + otherVector.y,
            this.z + otherVector.z
        )
    }

    sub(otherVector) {
        return new Vec3(
            this.x - otherVector.x,
            this.y - otherVector.y,
            this.z - otherVector.z
        )
    }

    mult(otherVector) {
        return new Vec3(
            this.x * otherVector.x,
            this.y * otherVector.y,
            this.z * otherVector.z
        )
    }

    mul(scalar) {
        return new Vec3(
            this.x * scalar,
            this.y * scalar,
            this.z * scalar
        )
    }

    lengthSquared() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    length() {
        return Math.sqrt(this.lengthSquared());
    }

    dot(otherVector) {
        return this.x * otherVector.x + this.y * otherVector.y + this.z * otherVector.z;
    }

    cross(otherVector) {
        return new Vec3(
            this.y * otherVector.z - this.z * otherVector.y,
            this.z * otherVector.x - this.x * otherVector.z,
            this.x * otherVector.y - this.y * otherVector.x
        );
    }

    unit() {
        const length = this.length();
        return new Vec3(
            this.x / length,
            this.y / length,
            this.z / length,
        );
    }

    nearZero() {
        // Return true if the vector is close to zero in all dimensions.
        const s = 1e-8;
        return Math.abs(this.x) < s && Math.abs(this.y) < s && Math.abs(this.z) < s;
    }

}
