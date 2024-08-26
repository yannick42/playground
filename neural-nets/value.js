
export class Value {

    constructor(data, label='', children=[], op='') {
        this.data = data;
        this.grad = 0;
        this._backward = function() {};
        this._prev = children;
        this.op = op;
        this.label = label;
    }

    add(other) {
        other = typeof other == "number" ? new Value(other) : other;
        
        const out = new Value(this.data + other.data, '', [this, other], '+');

        out._backward = () => {
            this.grad += 1 * out.grad;
            other.grad += 1 * out.grad;
        }
        return out;
    }

    sub(other) {
        return this.add(-other);
    }

    mul(other) {
        other = typeof other == "number" ? new Value(other) : other;

        const out = new Value(this.data * other.data, '', [this, other], '*');

        out._backward = () => {
            this.grad += other.data * out.grad;
            other.grad += this.data * out.grad;
        }
        return out;
    }

    div(other) {
        return this.mul(other.pow(-1));
    }

    pow(k) {
        const out = new Value(Math.pow(this.data, k), '', [this], `**${k}`)

        out._backward = () => {
            this.grad += k * (this.data ** (k - 1)) * out.grad; // ??
        }
        return out;
    }

    tanh() {
        const x = this.data;
        const t = (Math.exp(2*x) - 1) / (Math.exp(2*x) + 1)

        const out = new Value(t, '', [this], 'tanh');
        out._backward = () => {
            this.grad += (1 - t**2) * out.grad;
        }
        return out;
    }

    backward() {

        function toposort(v) {
            const topo = [];
            const visited = new Set();

            function buildTopo(v) {
                if(!visited.has(v)) {
                    visited.add(v);
                    //console.warn(v)
                    for(let child of v._prev) {
                        buildTopo(child);
                    }
                    topo.push(v);
                }
            }

            buildTopo(v);

            return topo;
        }

        this.grad = 1;
        const topo = toposort(this);

        for(let node of topo.reverse()) {
            //console.log("(backward) on node:", node)
            node._backward();
        }

        //console.log("(backward) topo sorted:", topo)
    }

}
