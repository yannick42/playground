export const entries = [{
    id: 'heightmap',
    href: './heightmap/',
    name: 'Heightmap',
    desc: 'Normals & bump mapping with the map of the world',
    classes: [],
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'convolution-filters',
    href: './convolution-filters/',
    name: 'Convolution Filters',
    desc: 'Kernels: blur, sharpen, Sobel filter, ...',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'gradient-descent',
    href: './gradient-descent/',
    name: 'Gradient descent',
    desc: 'applied to linear regression',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'logic-gates',
    href: './logic-gates/',
    name: 'Logic gates',
    desc: 'NAND, Mux, Full-Adder, Memory, Program Counter, ALU, ...',
    classes: ['disabled-entry'],
    chips: [{
        type: 'early-draft',
        text: "EARLY DRAFT"
    }]
},{
    id: 'splines',
    href: './splines/',
    name: 'Splines',
    desc: 'Bézier curves, Bernstein polynomials, ...',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'snake',
    href: './snake/',
    name: 'Snake game',
    desc: 'neural network (DAG) + genetic algorithm',
    chips: [{
        type: 'warning',
        text: "WIP"
    },{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'spreadsheet',
    href: './spreadsheet/',
    name: 'Spreadsheet',
    desc: 'application of topological sort.',
    chips: [{
        type: 'draft',
        text: 'DRAFT'
    }]
},{
    id: 'gray-scott',
    href: './gray-scott/',
    name: 'Gray-Scott model',
    desc: 'reaction-diffusion model.',
    chips: [{
        type: 'info',
        text: 'slow'
    }]
},{
    id: 'marbling',
    href: './marbling/',
    name: 'Marbling',
    desc: 'simulate painting drops technique.',
},{
    id: 'lagrange',
    href: './lagrange-interp/',
    name: 'Lagrange interpolation',
    desc: 'draw a polynomial interpolation curve between n given points.',
},{
    id: 'correlations',
    href: './correlations/',
    name: 'Correlation coefficients',
    desc: "Pearson's r, Spearman's ρ, Kendall's τ, cosine similarity",
},{
    id: 'delaunay',
    href: './delaunay/',
    name: 'Delaunay triangulation',
    desc: "method that maximizes triangles' minimal angle over a set of points.",
    chips: [{
        type: 'info',
        text: 'slow'
    }]
},{
    id: 'newton-fractals',
    href: './newton-fractals/dist/newton-fractals/browser/',
    name: 'Newton fractals',
    desc: "based on Newton-Raphson root finding method (over a complex function).",
    chips: [{
        type: 'info',
        text: 'slow startup'
    }]
},{
    id: 'lyapunov',
    href: './lyapunov-fractals/',
    name: 'Markus-Lyapunov fractals',
    desc: "using Lyapunov exponent λ.",
    chips: [{
        type: 'info',
        text: 'slow startup'
    }]
},{
    id: 'minimax',
    href: './minimax/dist/minimax/browser/',
    name: 'Minimax algorithm (with α-β pruning)',
    desc: "applied to Tic-tac-toe & Connect4 games.",
    chips: [{
        type: 'info',
        text: 'slow'
    },{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'metaballs',
    href: './metaballs/',
    name: 'Metaballs',
    desc: 'moving "blob" shapes using implicit function, marching square algorithm and linear interpolation.',
    chips: [{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'shading',
    href: './shading-methods/',
    name: 'Shading methods (WebGL)',
    desc: "flat, Gouraud and Phong shading.",
    chips: [{
        type: 'warning',
        text: 'WIP'
    },{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'sph',
    href: './sph/',
    name: 'Smoothed-particle hydrodynamics',
    desc: "to simulate water with SPH.",
    chips: [{
        type: 'warning',
        text: 'WIP'
    }]
},{
    id: 'traffic',
    href: './traffic/public/',
    name: 'Traffic jam',
    desc: "to control traffic lights.",
    chips: [{
        type: 'warning',
        text: 'WIP'
    }]
},{
    id: 'douglas-peucker',
    href: './douglas-peucker/',
    name: 'Douglas-Peucker algorithm (1973)',
    desc: "path simplification, divide-and-conquer...",
}];