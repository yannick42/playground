
export class Vector2D {

    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    //
    // vector and scalar operations
    //
    sub(otherVector) { return new Vector2D(this.x - otherVector.x, this.y - otherVector.y); }
    add(otherVector) { return new Vector2D(this.x + otherVector.x, this.y + otherVector.y); }
    mul(scalar) { return new Vector2D(this.x * scalar, this.y * scalar); }
    mag() { return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)); }
    dot(other) { return this.x * other.x + this.y * other.y; }
}

