export const entries = [{
    id: 'book-progression',
    href: './book-progression/',
    name: 'Book progression',
    desc: "tool to visualize progression on technical books",
    searchContext: 'tool',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'leaflet-playground',
    href: './leaflet-playground/',
    name: 'Leaflet Playground',
    desc: "GLMarkers, ...",
    searchContext: 'map',
},{
    id: 'douglas-peucker',
    href: './douglas-peucker/',
    name: 'Line simplification',
    desc: "Douglas-Peucker algorithm, ...",
    searchContext: 'divide-and-conquer,Visvalingam-Whyatt,path,SVG',
},{
    id: 'map-projections',
    href: './map-projections/',
    name: 'Map projections',
    desc: 'Mercator, equirectangular projection, ...',
    searchContext: '3D,sphere,ellipsoid',
    classes: ['disabled-entry'],
    chips: [{
        type: 'early-draft',
        text: "EARLY DRAFT"
    }]
},{
    id: 'projections',
    href: './projections/',
    name: '3D projections',
    desc: 'orthographic & perspective projections',
    searchContext: 'game,matrix',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'heightmap',
    href: './heightmap/',
    name: 'Heightmap',
    desc: 'normals & bump mapping with the map of the world',
    searchContext: 'game,3D',
    classes: [],
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'convolution-filters',
    href: './convolution-filters/',
    name: 'Convolution filters',
    desc: 'kernels: blur, sharpen, Sobel filter, ...',
    searchContext: 'matrix,dogs',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'gradient-descent',
    href: './gradient-descent/',
    name: 'Gradient descent',
    desc: 'Batch GD & SGD applied to linear regression',
    searchContext: 'Stochastic,machine learning',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'logic-gates',
    href: './logic-gates/',
    name: 'Logic gates',
    desc: '<b>TODO:</b> NAND, Mux, Full-Adder, Memory, Program Counter, ALU, ...',
    searchContext: 'electronics,digital logic,MOOC',
    classes: ['disabled-entry'],
    chips: [{
        type: 'early-draft',
        text: "EARLY DRAFT"
    }]
},{
    id: 'splines',
    href: './splines/',
    name: 'Splines',
    desc: 'Bézier curves, ...',
    searchContext: 'Bernstein polynomials,lerp,linear interpolation,Casteljau',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'snake',
    href: './snake/',
    name: 'Snake game',
    desc: 'neural network (DAG) + genetic algorithm (crossover, mutation)',
    searchContext: 'AI',
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
    searchContext: 'graph algorithm',
    chips: [{
        type: 'draft',
        text: 'DRAFT'
    }]
},{
    id: 'gray-scott',
    href: './gray-scott/',
    name: 'Gray-Scott model',
    desc: 'reaction-diffusion model.',
    searchContext: 'Coding Train',
    chips: [{
        type: 'info',
        text: 'slow'
    },{
        type: 'draft',
        text: 'DRAFT'
    }]
},{
    id: 'marbling',
    href: './marbling/',
    name: 'Marbling',
    desc: 'simulate painting drops technique.',
    searchContext: 'Coding Train,art',
    chips: [{
        type: 'draft',
        text: 'DRAFT'
    }]
},{
    id: 'lagrange',
    href: './lagrange-interp/',
    name: 'Lagrange interpolation',
    desc: 'draw a polynomial interpolation curve between n given points.',
    searchContext: 'math',
},{
    id: 'correlations',
    href: './correlations/',
    name: 'Correlation coefficients',
    desc: "Pearson's r, Spearman's ρ, Kendall's τ, cosine similarity",
    searchContext: 'math,statistics',
},{
    id: 'delaunay',
    href: './delaunay/',
    name: 'Delaunay triangulation',
    desc: "maximizes triangles' minimal angle over a set of points.",
    searchContext: 'computational geometry,winged edge',
    chips: [{
        type: 'info',
        text: 'slow'
    }]
},{
    id: 'newton-fractals',
    href: './newton-fractals/dist/newton-fractals/browser/',
    name: 'Newton fractals',
    desc: "based on Newton-Raphson root finding method (over a complex function).",
    searchContext: 'recreational',
    chips: [{
        type: 'info',
        text: 'slow startup'
    },{
        type: 'draft',
        text: 'DRAFT'
    }]
},{
    id: 'lyapunov',
    href: './lyapunov-fractals/',
    name: 'Markus-Lyapunov fractals',
    desc: "using Lyapunov exponent λ formula.",
    searchContext: 'chaos',
    chips: [{
        type: 'info',
        text: 'slow startup'
    }]
},{
    id: 'minimax',
    href: './minimax/dist/minimax/browser/',
    name: 'Minimax algorithm',
    desc: "with α-β pruning, applied to Tic-tac-toe & Connect4 games.",
    searchContext: 'AI',
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
    searchContext: 'lerp,linear interpolation,2D,3D',
    chips: [{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'shading',
    href: './shading-methods/',
    name: 'Shading methods (WebGL)',
    desc: "flat, Gouraud and Phong shading.",
    searchContext: '3D,game',
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
    desc: "trying to simulate water with SPH...",
    searchContext: 'physics',
    chips: [{
        type: 'warning',
        text: 'WIP'
    }]
},{
    id: 'traffic',
    href: './traffic/public/',
    name: 'Traffic jam',
    desc: "to control traffic lights.",
    searchContext: 'graph algorithms',
    chips: [{
        type: 'warning',
        text: 'WIP'
    }]
}];