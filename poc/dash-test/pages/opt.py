
import numpy as np
import matplotlib.pyplot as plt

from jax import grad, jit
import jax.numpy as jnp

from math import pi, exp, sqrt, cos

import random

from matplotlib import ticker

def rosenbrock_function(x, a=1, b=5):
  return (a - x[0])**2 + b * (x[1] - x[0]**2)**2

def sphere_function(x):
  return x[0]**2 + x[1]**2

@jit
def ackley_function(x, a=20, b=0.2, c=2 * pi):
    """
    Compute the Ackley function.

    Parameters:
    x (array-like): Input array of values (1D or 2D).
    a (float): Parameter, default is 20.
    b (float): Parameter, default is 0.2.
    c (float): Parameter, default is 2 * pi.

    Returns:
    float: Ackley function value.
    """

    n = 2
    term1 = -a * jnp.exp(-b * jnp.sqrt(x[0]**2 / n + x[1]**2 / n))
    term2 = -jnp.exp((jnp.cos(c * x[0]) / n) + (jnp.cos(c * x[1]) / n))
    return term1 + term2 + a + jnp.exp(1)




functions = {
  'rosenbrock': rosenbrock_function,
  'rosenbrock_grad': grad(rosenbrock_function),
  'sphere': sphere_function,
  'sphere_grad': grad(sphere_function),
  'ackley': ackley_function,
  'ackley_grad': grad(ackley_function),
}



#starting_point = [np.random.uniform(-2, 2), np.random.uniform(-2, 2)]
#starting_point = [-1., 0.]
#starting_point = [-1., -1.9]
starting_point = [-1.5, 0.5]
x_init = jnp.array(starting_point)

x = None # ???

values_2 = []

ALPHA = 0.05 # constant
TOLERANCE = 1e-3 # to know when to stop iterating    
MAX_ITER = 100





def bracket_minimum(f, x=0, s=1e-2, k=2):
  a, ya = x, f(x)
  b, yb = a + s, f(a + s)
  if yb > ya:
    a, b = b, a
    ya, yb = yb, ya
    s = -s

  while True:
    c, yc = b + s, f(b + s)
    if yc > yb:
      return (a, c) if a < c else (c, a)

    a, ya, b, yb = b, yb, c, yc
    s *= k


def line_search(f, x, d):
  objective = lambda α: f([x_i + α * d[i] for i, x_i in enumerate(x)])
  a, b = bracket_minimum(objective) # around x=0 by default
  α = golden_section_search(objective, a, b, n=10)
  α = (α[-1][1] + α[-1][0]) / 2 # average over last range !!
  return α, [x_i + α * d[i] for i, x_i in enumerate(x)]

from math import sqrt

φ = 1.61803398875 # golden ratio

def golden_section_search(f, a, b, n = 10):
  values = [(a, b)]

  ρ = φ - 1

  d = ρ * b + (1 - ρ) * a
  yd = f(d)

  for i in range(1, n): # from 1 to n-1
    c = ρ * a + (1 - ρ) * b
    yc = f(c)

    if yc < yd:
      b, d, yd = d, c, yc
    else:
      a, b = b, c

    values.append((a, b))

  return [values, (a, b) if a < b else (b, a)]


class DescentMethod:
  #direction = None
  #grad = None
  def __init__(self, f, df, x):
    self.f = f
    self.df = df

  def step(self, x):
    pass


class GradientDescent(DescentMethod):

  def step(self, x):

    gradient = self.df(x) # gradient direction
    gradient /= np.abs(gradient) # normalized
    direction = -gradient
    α, new_x = line_search(self.f, x, direction)

    return α, new_x, self.f(x)




class ConjugateGradientDescent(DescentMethod):

  prev_d = None # previous search direction
  prev_g = None # previous gradient vector at point x

  def __init__(self, f, df, x):
    super(ConjugateGradientDescent, self).__init__(f, df, x) # call parent's constructor

    # init: keep track of "previous" values
    self.prev_g = self.df(x)  # gradient vector at point x
    self.prev_d = - self.prev_g / np.abs(self.prev_g) # (normalized) descent direction

  def step(self, x):

    gradient = self.df(x)         # gradient at current point x
    gradient /= np.abs(gradient)  # normalized to get a unit vector
    #print(type(gradient)) # <class 'jaxlib.xla_extension.ArrayImpl'>

    # Polak-Ribière update (1969)
    num = np.dot(gradient, gradient - self.prev_g)
    denom = self.prev_g * self.prev_g
    β = num / denom

    # automatic resets (?)
    β = np.max(
      np.vstack((np.zeros(len(β)), β)), # stack zeros "above", to compute "max" along each matrix columns
      axis=0
    )
    # beta vector components must always be greater or equal to 0
    # eg. β = [0.2, 1.222]

    # compute the gradient direction
    direction = - gradient + β * self.prev_d

    # use LINE SEARCH to find optimal step along the computed direction (same as Gradient Descent)
    α, new_x = line_search(self.f, x, direction)

    # saved for next iteration
    self.prev_d = direction
    self.prev_g = gradient

    return α, new_x, self.f(x)


class Momentum(DescentMethod):

  α = None # learning rate
  β = None # momentum decay (if 0 = gradient descent)
  v = None # momentum

  def __init__(self, f, df, x, alpha=0.01, beta=0.9):
    super(Momentum, self).__init__(f, df, x) # call parent's constructor
    self.α = alpha
    self.β = beta
    self.v = np.zeros(len(x)) # [0, 0]

  def step(self, x):
    g = self.df(x)  # gradient at current point x
    g /= np.abs(g)  # normalized to get a unit vector

    self.v = self.β * self.v - self.α * g
    new_x = x + self.v

    return None, new_x, self.f(x)


from collections.abc import Callable # typing
Vector = list[float]

class NesterovMomentum(DescentMethod):

  α = None # learning rate (default = 0.01)
  β = None # momentum decay (0 = gradient descent, default = 0.9)
  v = None # momentum (vector)

  # constructor function
  def __init__(self, f: Callable, df: Callable, x: Vector, alpha: float = 0.01, beta: float = 0.9):
    super(NesterovMomentum, self).__init__(f, df, x) # call parent's constructor

    self.α = alpha
    self.β = beta
    self.v = np.zeros(len(x)) # [0, 0] for 2d (scalar multivariate function)

  def step(self, x: Vector) -> list[float, Vector, float]:
    # gradient of the projected future position
    g_proj = self.df(x + self.β * self.v) # gradient at current point x + ...
    g_proj /= np.abs(g_proj) # normalized to get a unit vector

    self.v = self.β * self.v - self.α * g_proj
    new_x = x + self.v

    return [None, new_x, self.f(x)] # 1st param. "alpha" unused / not present

from collections.abc import Callable # typing
Vector = list[float]

# adaptive subgradient method (2011)
# - far less sensitive to the learning rate parameter
# - motivated by SDG (and sparse gradient), picked a random mini-batch of training data
class Adagrad(DescentMethod):

  α = None
  ϵ = 1e-8 # a small value to prevent division by zero
  s = None # sum of the squared gradient

  # constructor function
  def __init__(self, f: Callable, df: Callable, x: Vector, alpha=0.01):
    super(Adagrad, self).__init__(f, df, x) # call parent's constructor

    self.α = alpha
    self.s = np.zeros(len(x))

  def step(self, x: Vector) -> list[float, Vector, float]:
    # normalized gradient at point x
    g = self.df(x)
    g /= np.abs(g)

    self.s += g * g # squared
    new_x = x - (self.α / (self.ϵ + np.sqrt(self.s))) * g

    return [None, new_x, self.f(x)] # 1st param. "alpha" unused / not present





"""
- Quasi-Newton methods
"""

# same convergence properties as Conjugate gradient method
# first concept in 1959, then modified in 1963 (Fletcher & Powell), published in 1991 ?!
class DFP(DescentMethod):

  # constructor function
  def __init__(self, f: Callable, df: Callable, x: Vector):
    super(DFP, self).__init__(f, df, x) # call parent's constructor

    self.m = len(x)
    self.Q = np.eye(len(x))

  def step(self, x: Vector) -> list[float, Vector, float]:
    
    g = self.df(x)
    α, new_x = line_search(self.f, x, -self.Q @ g)

    g_prime = self.df(new_x)
    delta = jnp.expand_dims(jnp.array(new_x) - x, 1) # (1, 2)
    gamma = jnp.expand_dims(jnp.array(g_prime) - g, 1) # (1, 2)

    #print(delta, gamma, self.Q)

    # (2, 2)
    self.Q = self.Q \
      - (self.Q @ gamma @ gamma.T @ self.Q) \
      / (gamma.T @ self.Q @ gamma) \
      + (delta @ delta.T) / (delta.T @ gamma)

    return [None, new_x, self.f(x)] # 1st param. "alpha" unused / not present

# still use a n x n matrix
# use Limited-memory BFGS to approximate solution -> stores the last m values for delta and gamma
class BFGS(DescentMethod):

  # constructor function
  def __init__(self, f: Callable, df: Callable, x: Vector):
    super(BFGS, self).__init__(f, df, x) # call parent's constructor

    self.m = len(x)
    self.Q = np.eye(len(x))

  def step(self, x: Vector) -> list[float, Vector, float]:
    
    g = self.df(x)
    α, new_x = line_search(self.f, x, -self.Q @ g)

    g_prime = self.df(new_x)
    delta = jnp.expand_dims(jnp.array(new_x) - x, 1) # (1, 2)
    gamma = jnp.expand_dims(jnp.array(g_prime) - g, 1) # (1, 2)

    #print(delta, gamma, self.Q)

    # (2, 2)
    self.Q = self.Q \
      - (delta @ gamma.T @ self.Q + self.Q @ gamma @ delta.T) \
      / (delta.T @ gamma) \
      + (1 + (gamma.T @ self.Q @ gamma) / (delta.T @ gamma))[1] * (delta @ delta.T) / (delta.T @ gamma)

    return [None, new_x, self.f(x)] # 1st param. "alpha" unused / not present



methods = {}

hide_trail = False


iter_2 = 0

















def compute(methods_to_show, test_function='rosenbrock', change_start=False):
    print("compute")


    global values_2, starting_point, x_init, methods, iter_2
    values_2 = [] # reinit

    methods = {
        'gd': {
            'hide': False,
            'name': 'Gradient descent',
            'method': GradientDescent(f=functions[test_function], df=functions[test_function + '_grad'], x=x_init),
            'values': [],
            'arrows': [],
            'iter': 0,
            'color': 'lime',
            'x_opt': None,
            'label': lambda method: 'Gradient Descent $\\bf{(in\ ' + str(method['iter']) + '\ steps)}$',
        },
        'cgd': {
            'hide': False,
            'name': 'Conjugate GD',
            'method': ConjugateGradientDescent(f=functions[test_function], df=functions[test_function + '_grad'], x=x_init),
            'values': [],
            'arrows': [],
            'iter': 0,
            'color': 'deeppink',
            'x_opt': None,
            'label': lambda method: 'Conjugate GD $\\bf{(in\ ' + str(method['iter']) + '\ steps)}$ \nwith Polak-Ribière update $\it{(1969)}$',
        },
        'momentum': {
            'hide': False,
            'name': 'Momentum',
            'method': Momentum(f=functions[test_function], df=functions[test_function + '_grad'], x=x_init, alpha=0.05, beta=0.85),
            'values': [],
            'arrows': [],
            'iter': 0,
            'color': 'orange',
            'x_opt': None,
            'label': lambda method: 'Momentum $\\bf{(in\ ' + str(method['iter']) + '\ steps)}$ \nwith α=' + str(method['method'].α) + ' and β=' + str(method['method'].β),
        },
        'nesterov_momentum': {
            'hide': False,
            'name': 'Nesterov momentum',
            'method': NesterovMomentum(f=functions[test_function], df=functions[test_function + '_grad'], x=x_init, alpha=0.05, beta=0.85),
            'values': [],
            'arrows': [],
            'iter': 0,
            'color': 'lightcoral',
            'x_opt': None,
            'label': lambda method: 'Nesterov momentum $\\bf{(in\ ' + str(method['iter']) + '\ steps)}$ \nwith α=' + str(method['method'].α) + ' and β=' + str(method['method'].β),
        },
        'adagrad': {
            'hide': False,
            'name': 'Adagrad',
            'method': Adagrad(f=functions[test_function], df=functions[test_function + '_grad'], x=x_init, alpha=0.1),
            'values': [],
            'arrows': [],
            'iter': 0,
            'color': 'darkred',
            'x_opt': None,
            'label': lambda method: 'Adagrad $\\bf{(in\ ' + str(method['iter']) + '\ steps)}$ \nwith α=' + str(method['method'].α),
        },
        'dfp': {
            'hide': False,
            'name': 'Adagrad',
            'method': DFP(f=functions[test_function], df=functions[test_function + '_grad'], x=x_init),
            'values': [],
            'arrows': [],
            'iter': 0,
            'color': 'grey',
            'x_opt': None,
            'label': lambda method: 'DFP $\\bf{(in\ ' + str(method['iter']) + '\ steps)}$ ',
        },
        'bfgs': {
            'hide': False,
            'name': 'Adagrad',
            'method': BFGS(f=functions[test_function], df=functions[test_function + '_grad'], x=x_init),
            'values': [],
            'arrows': [],
            'iter': 0,
            'color': 'yellow',
            'x_opt': None,
            'label': lambda method: 'BFGS $\\bf{(in\ ' + str(method['iter']) + '\ steps)}$ ',
        }
    }


    if change_start:
        starting_point = [random.uniform(-1.8, 1.8), random.uniform(-0.3, 1.8)]
        x_init = jnp.array(starting_point)

    print(f"starting point: {starting_point}" + (" (new)" if change_start else ""))

    #x = jnp.array(starting_point, dtype=float)

    x_init = jnp.array(starting_point)

    #
    #
    #
    for i, (method, obj) in enumerate(methods.items()):

        x = x_init
        length = None

        # erase previous computation
        obj['values'] = []
        obj['arrows'] = []
        obj['x_opt'] = None
        obj['iter'] = 0

        if obj['hide'] or method not in methods_to_show:
            continue

        print("computing with " + method)

        while length is None or (length > TOLERANCE and obj['iter'] < MAX_ITER): # stop if no more progress on GD (not CGD..)
            #
            # take one step
            #
            α, new_x, value_at_x = obj['method'].step(x)
            obj['values'].append(value_at_x)

            length = np.linalg.norm(np.array(new_x) - x)
            #print(length)

            obj['arrows'].append((x, new_x))

            # update step
            #x = x - α * gradient
            x = jnp.array(new_x)

            obj['iter'] += 1

        obj['x_opt'] = x # final point

        #print(method, obj['iter'])


    x = jnp.array(starting_point) # same as above
    length = None

    iter_2 = 0

    for i in range(methods['gd']['iter']):

        values_2.append(functions[test_function](x))

        gradient = functions[test_function + "_grad"](x)
        direction = - gradient / np.abs(gradient) # gradient direction (normalized)

        new_x = x + ALPHA * direction

        length = np.linalg.norm(np.array(new_x) - x)
        #print(length)

        #if not hide_trail:
        #  drawArrow(ax, x, new_x, color='blue', alpha=0.6, zorder=1.5)

        # update step
        #x = x - α * gradient
        x = jnp.array(new_x)
        iter_2 += 1


def visualize(methods_to_show, test_function='rosenbrock'):

    print("(visualize)")
    global iter_2

    def drawArrow(ax, x, new_x, color='red', alpha=1, zorder=2):
        length = np.linalg.norm(np.array(new_x) - x)
        ax.arrow(
            x[0], x[1], new_x[0] - x[0], new_x[1] - x[1],
            width=0.00015, # default = 0.001
            color=color,
            length_includes_head=True,
            head_width=0.05 if length > 0.1 else 0,
            head_length=0.03 if length > 0.1 else 0,
            zorder=zorder,
            alpha=alpha,
        )

    # Plots
    fig, (ax, ax2) = plt.subplots(ncols=2, figsize=(11, 6))

    """
    Contour plot
    """
    ngridx = 500
    ngridy = 500
    x1 = np.linspace(-2.0, 2.0, ngridx)
    x2 = np.linspace(-.5, 2.0, ngridy)

    X1, X2 = np.meshgrid(x1, x2)
    v_func = np.vectorize(lambda x, y: functions[test_function]([x, y]))
    Y = v_func(X1, X2)

    if test_function in ['ackley', 'sphere']:
      csf = ax.contourf(X1, X2, Y, levels=15, cmap="viridis") #  ignored by contourf
      cs = ax.contour(csf, linewidths=1, colors='k')
      ax.clabel(cs, inline=True, fontsize=6, zorder=1)
      fig.colorbar(csf, ax=ax)
    else:
      csf = ax.contourf(X1, X2, Y, locator=ticker.LogLocator(), levels=15, cmap="viridis") #  ignored by contourf
      cs = ax.contour(csf, linewidths=1, colors='k')
      ax.clabel(cs, inline=True, fontsize=6, zorder=1)
      fig.colorbar(csf, ax=ax)

    print("(visualize) contour plot. Done.")

    # starting point
    ax.scatter(
        starting_point[0], starting_point[1],
        c='white',
        marker='o',
        s=20,
        zorder=4,
    )
    # True optimal point for GD

    if test_function == 'rosenbrock':
      circle = plt.Circle((1, 1), 0.15, color='white', fill=False)
      ax.add_patch(circle)
    
    """ax.scatter(
        1, 1,
        c='white',
        marker='x',
        s=50,
        zorder=4,
        linewidths=1,
    )"""

    # optimal point found for GD (with fixed learning rate = 0.05)
    """ax.scatter(
        x[0], x[1],
        c='blue',
        marker='x',
        s=50,
        zorder=3,
        linewidths=3,
    )"""

    # optimal point found for each methods
    for i, (method, obj) in enumerate(methods.items()):
        if not obj['hide'] and method in methods_to_show:
            ax.scatter(
            methods[method]['x_opt'][0], methods[method]['x_opt'][1],
            c=methods[method]['color'],
            marker='x',
            s=50,
            zorder=3,
            linewidths=3,
            )

    print("(visualize) show optimal points found per method. Done.")


    # show trail
    for  i, (method, obj) in enumerate(methods.items()):
        if not hide_trail and method in methods_to_show:
            for arrow in methods[method]['arrows']:
                drawArrow(ax, arrow[0], arrow[1], obj['color'])

    print("(visualize) show trail. Done.")



    # cost function evolution, for each method
    ax2.plot(range(0, len(values_2)), values_2, color='blue', label='fixed step-size (α=' + str(ALPHA) + ') $\\bf{(in\ ' + str(iter_2) + '\ steps)}$')
    for i, (method, obj) in enumerate(methods.items()):
        if not obj['hide'] and method in methods_to_show:
            ax2.plot(range(0, len(methods[method]['values'])), methods[method]['values'], color=obj['color'], label=obj['label'](methods[method]))

    ax2.scatter(0, values_2[0], c='white', marker='o', s=10, linewidths=3, zorder=2);
    ax2.scatter(methods['gd']['iter'], values_2[-1], c='blue', marker='x', s=50, linewidths=3);
    for i, (method, obj) in enumerate(methods.items()):
        if not obj['hide'] and method in methods_to_show:
            ax2.scatter(methods[method]['iter'], methods[method]['values'][-1], c=methods[method]['color'], marker='x', s=50, linewidths=3);

    ax2.set_title("    Cost function", loc="left")
    ax2.text(
        0.5, 1.05,
        r"until improvement $\epsilon < "+str(TOLERANCE)+"$ \nor maxIter (="+str(MAX_ITER)+") is reached",
        fontsize='small',
        transform=ax2.transAxes, # no more data-coordinates but (0, 0) to (1, 1)
        bbox=dict(facecolor='red', alpha=0.25)
    )
    ax2.set_xlabel('Iteration N°')
    ax2.set_ylabel('y')
    ax2.legend(fontsize=7, borderpad=1, labelspacing=0.8, handlelength=3)

    # Rosenbrock's banana
    ax.set_title(test_function + " test function")
    ax.set_xlabel(r'$x_1$')
    ax.set_ylabel(r'$x_2$')

    fig.suptitle(
        'First-order + Quasi-Newton methods',
        fontsize='x-large'
    )

    ax2.grid() # add grid
    ax2.set_facecolor('lightgray')

    return plt


if __name__ == 'main':
    compute()
    visualize()
