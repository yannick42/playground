export class Interval {
    min;
    max;
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    surrounds(x) {
        return this.min < x && x < this.max;
    }
}