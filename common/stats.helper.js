
//
// __Rejection sampling__ to get random values following a given probability distribution
//  -> the most basic Monte-Carlo sampler (but less efficient than other methods : MCMCs, SMCs ??)
//  -> it's trivially parallelizable !
// p(x) is a target distribution => here, Gaussian (with mean = 0 and sigma = 1)
// q(x) is the proposal distribution = uniform only in JS ...
//
export function rejectionSampling(proposalDist, targetDist, nb_rejections=null) {
    let reject = true; // init.

    nb_rejections = nb_rejections ?? { count : 0 }

    let randomX = proposalDist(); // uniform along the x-axis
    let randomY = Math.random() * 0.4; // uniform the y-axis (up to the max of targetDist ???)

    let y = targetDist(randomX); // true y-value of the target p(x)

    //console.log("at randomX:", randomX, "randomY:", randomY, "<", y)

    let i = 0;
    while(reject && i < 10) {
        if(randomY > y) { // if outside of its "shape"
            // reject, and try again!
            //console.log("reject Y !")
            randomX = proposalDist();
            randomY = Math.random() * 0.4;
            y = targetDist(randomX);

            nb_rejections.count += 1;

            //console.log("at randomX:", randomX, "randomY:", randomY, "<", y)
        } else {
            // accept
            reject = false;
        }
        i++;
    }
    return randomX;
}

// https://en.wikipedia.org/wiki/Normal_distribution
export function gaussian(x, sigma=1, mean=0) {
    return 1 / (sigma * Math.sqrt(2 * Math.PI)) * Math.exp(-1/2 * Math.pow((x - mean) / sigma, 2));
}
