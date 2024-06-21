
export function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy);
}
