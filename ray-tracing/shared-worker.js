//import { Vec3 } from './vec3.js';

onconnect = function (e) {
    console.log("onconnect", e);

    const port = e.ports[0];
    console.log("port:", port);
  
    port.onmessage = function (e) {
        console.log("onmessage", e)

        const   i = e.data.i,
                j = e.data.j,
                camera = e.data.camera,
                world = e.data.world;
    
        //const pixelColor = new Vec3(0, 0, 0);
        const pixelColor = camera.processPixel(i, j, world);
        
        // send pixel color result to main thread
        port.postMessage({i, j, pixelColor});
    };
    
    // Start listening to messages
    port.start(); // Required when using addEventListener
    console.log("start listening to messages")
};
