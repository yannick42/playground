
export function randInt(min, max) {
    // Ensure the min and max values are integers
    min = Math.ceil(min);
    max = Math.floor(max);
    // Generate a random integer between min and max (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

export function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
