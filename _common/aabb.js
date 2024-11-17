export class AABB {

    center;
    halfDimension;

    constructor(center, halfDimension) {
        this.center = center;
        this.halfDimension = halfDimension;
    }

    contains(point) {
        if(point.x >= this.center.x - this.halfDimension && point.x <= this.center.x + this.halfDimension
            && point.y >= this.center.y - this.halfDimension && point.y <= this.center.y + this.halfDimension
        ) {
            return true;
        }
        return false;
    }

    intersect(range) {
        return !(
            this.center.x + this.halfDimension < range.center.x - range.halfDimension || // this AABB is to the left of "range"
            range.center.x + range.halfDimension < this.center.x - this.halfDimension || // "range" is to the left of this AABB
            this.center.y + this.halfDimension < range.center.y - range.halfDimension || // this AABB is above "range"
            range.center.y + range.halfDimension < this.center.y - this.halfDimension
        );
    }
}