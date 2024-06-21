
export class Color {
    constructor(red, green, blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    toString() {
        return '#' + this.red.toString(16).padStart(2, 0) + this.green.toString(16).padStart(2, 0) + this.blue.toString(16).padStart(2, 0);
    }
}

export function hslColorToRgb(hue, saturation, lightness) {
    if (saturation == 0.0) {
        // The color is achromatic (has no color)
        // Thus use its lightness for a grey-scale color
        let grey = Math.round(lightness * 255);
        return new Color(grey, grey, grey);
    }

    let q;
    if (lightness < 0.5) {
        q = lightness * (1 + saturation);
    } else {
        q = lightness + saturation - lightness * saturation;
    }
    let p = 2 * lightness - q;

    let oneThird = 1.0 / 3;
    let red = Math.round((hueToRgb(p, q, hue + oneThird)) * 255);
    let green = Math.round((hueToRgb(p, q, hue)) * 255);
    let blue = Math.round((hueToRgb(p, q, hue - oneThird)) * 255);

    return new Color(red, green, blue);
}

export function hueToRgb(p, q, t) {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }

    if (t < 1.0 / 6) {
        return p + (q - p) * 6 * t;
    }
    if (t < 1.0 / 2) {
        return q;
    }
    if (t < 2.0 / 3) {
        return p + (q - p) * (2.0 / 3 - t) * 6;
    }
    return p;
}

export function transitionOfHueRange(percentage, startHue, endHue) {
    // From 'startHue' 'percentage'-many to 'endHue'
    // Finally map from [0°, 360°] -> [0, 1.0] by dividing
    let hue = ((percentage * (endHue - startHue)) + startHue) / 360;

    let saturation = 1.0;
    let lightness = 0.5;

    // Get the color
    return hslColorToRgb(hue, saturation, lightness);
}

