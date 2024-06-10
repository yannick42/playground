
export function convertToRGB(color) {
    document.querySelector("canvas").getContext('2d').fillStyle = color;
    return document.querySelector("canvas").getContext('2d').fillStyle;
}

// see also : https://stackoverflow.com/a/39147465
export function RGBToHSL(r, g, b) {
    
    // Make r, g, and b fractions of 1
    r /= 255;
    g /= 255;
    b /= 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin, // chroma
        h = 0,
        s = 0,
        l = 0;

    // Calculate hue
    // -> https://en.wikipedia.org/wiki/HSL_and_HSV#Hue_and_chroma
    // No difference
    if (delta === 0)
      h = 0;
    // Red is max
    else if (cmax === r)
      h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax === g)
      h = (b - r) / delta + 2;
    // Blue is max
    else
      h = (r - g) / delta + 4; // RYGCP

    h = Math.round(h * 60); // in degree

    // Make negative hues positive behind 360°
    if (h < 0) {
        h += 360; // red = 0°
    }

    // Calculate lightness
    l = (cmax + cmin) / 2; // midpoint

    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return [h, s, l];
}
