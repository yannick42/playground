export const entries = [{
    id: 'shunting-yard',
    href: './shunting-yard/',
    name: 'Shunting-yard algorithm',
    desc: "to evaluate expressions",
    searchContext: '',
    creationDate: '11/2/2025'
},{
    id: 'fluid',
    href: './fluid/',
    name: 'Fluid dynamics',
    desc: "To simulate smoke, fire, ...",
    searchContext: '',
    creationDate: '21/12/2024',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    },{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'verlet',
    href: './verlet/',
    name: 'Verlet integration',
    desc: "Simulate physical system: collisions, rigid bodies, ...",
    searchContext: '',
    creationDate: '15/11/2024',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    },{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'quadtree',
    href: './quadtree/',
    name: 'Quadtree',
    desc: "2d tree datastructure",
    searchContext: '',
    creationDate: '06/08/2024',
    chips: []
},{
    id: 'ray-tracing',
    href: './ray-tracing/',
    name: '3D Ray Tracing',
    desc: "A recursive path tracer",
    searchContext: '',
    creationDate: '02/08/2024',
    updateDate: '04/08/2024',
    chips: []
},{
    id: 'tsp',
    href: './tsp/',
    name: 'Traveling Salesman Problem',
    desc: "approximation methods/heuristics: 2-opt, simulated annealing, ...",
    searchContext: '',
    creationDate: '28/07/2024',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'mysql-plan',
    href: './mysql-plan/',
    name: 'MySQL Execution Plans',
    desc: "Trying to make sense of its JSON export",
    searchContext: '',
    creationDate: '24/07/2024',
    classes: ['disabled-entry'],
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'graph-algorithms',
    href: './graph-algorithms/',
    name: 'Graph algorithms',
    desc: "Hierholzer, Kruskal, force-directed layout, ...",
    searchContext: '',
    creationDate: '21/07/2024',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'collisions',
    href: './collisions/',
    name: 'Collisions',
    desc: "Elastic collision physics",
    searchContext: '',
    creationDate: '17/07/2024'
},{
    id: 'DCEL',
    href: './DCEL/',
    name: 'Doubly-connected edge list',
    desc: "to handle PSLG : voronoi diagram, ...",
    searchContext: '',
    creationDate: '14/07/2024',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'numerical-integration',
    href: './numerical-integration/',
    name: 'Numerical Integration',
    desc: "Various methods: trapezoidal rule, Simpson's rules, ...",
    searchContext: '',
    creationDate: '09/07/2024',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    },{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'line-intersection',
    href: './line-intersection/',
    name: 'BST & Segment intersections',
    desc: "Naive vs. plane sweep algorithm",
    searchContext: '',
    creationDate: '05/07/2024',
    chips: [{
        type: 'buggy',
        text: 'buggy'
    }]
},{
    id: 'two-sat',
    href: './2-sat/',
    name: '2-SAT',
    desc: "solve simple satisfiability problems using strongly connected components",
    searchContext: 'SCC,Strongly Connected Components,topological sort',
    creationDate: '15/06/2024',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
},{
    id: 'book-progression',
    href: './book-progression/',
    name: 'Book progression',
    desc: "A tool to visualize progression in technical books",
    searchContext: 'tool,book,reading',
    chips: [{
        type: 'tool',
        text: "TOOL"
    }]
},{
    id: 'leaflet',
    href: './leaflet/',
    name: 'Leaflet',
    desc: "GLMarkers, ...",
    searchContext: 'map',
    chips: [{
        type: 'draft',
        text: "DRAFT"
    }]
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
    chips: [{
        type: 'draft',
        text: "DRAFT"
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
    desc: 'kernels: blur, sharpen, Sobel filter, LoG, ...',
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
    id: 'random-sampling',
    href: './random-sampling/',
    name: 'Random Sampling',
    desc: "Uniform, Poisson disk sampling, acceptance-rejection method, ...",
    searchContext: '',
    creationDate: '17/03/2024'
},{
    id: 'gray-scott',
    href: './gray-scott/',
    name: 'Gray-Scott model',
    desc: 'reaction-diffusion model.',
    searchContext: 'Coding Train',
    chips: [{
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
    },{
        type: 'buggy',
        text: 'buggy'
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
    searchContext: 'lerp,linear interpolation,2D,3D'
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