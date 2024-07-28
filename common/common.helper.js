
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

// Fisher-Yates (Knuth) shuffle
export function shuffle(array) {
    let currentIndex = array.length;
    // while there remain elements to shuffle...
    while (currentIndex != 0) {
      // pick a remaining element
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// ??
export function loadHeightMap(pngFile, callback) {
    // create an Image
    const image = new Image();
    image.src = pngFile;

    // when file loaded -> put it in its own temporary canvas
    image.onload = function(e) {

        const heightMapCanvas = document.createElement('canvas');
        const hmCtx = heightMapCanvas.getContext('2d');

        // resize to its full size
        heightMapCanvas.width = image.width;
        heightMapCanvas.height = image.height;

        //console.log("image:", image); // <img .../>
        hmCtx.drawImage(image, 0, 0, image.width, image.height);
        const heightmap = hmCtx.getImageData(0, 0, image.width, image.height); // store it globally (ready to pursue "computeMaps")
        //console.log("heightmap:", heightmap);
        /*
            ImageData {
                data: Uint8ClampedArray(8 547 840),
                width: 1920,
                height: 1113,
                colorSpace: 'srgb'
            }
        */

        callback(heightmap, image);
    }
}

export const printVar = (obj, fn='log') => {
    const propertyName = Object.keys(obj)[0];
    for(let propertyName of Object.keys(obj)) {
        console[fn](propertyName, "=", obj[propertyName]);
    }
};
