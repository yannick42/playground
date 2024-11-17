
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
    div(scalar) {
        if(scalar) return new Vector2D(this.x / scalar, this.y / scalar);
        else throw new "Division by zero"
    }
    
    mag() { return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)); }

    // dot product between 2 2-d vectors
    dot(other) { return this.x * other.x + this.y * other.y; }

    // normalize to a "unit" vector
    unit() { return new Vector2D(this.x / this.mag(), this.y / this.mag()) }
}

