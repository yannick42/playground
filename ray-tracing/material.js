
export class Material {

    emitted(u, v, p) {
        return new Vec3(0, 0, 0); // black
    }

    scatter(rayIn, record) { //, attenuation /*out*/, scattered /*out*/) {
        return [false, null, null];
    }

}
