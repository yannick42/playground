import dash
from dash import Dash, html, dcc, callback, Output, Input
import dash_bootstrap_components as dbc
import plotly.express as px

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import pandas as pd

import io
import base64

import numpy as np
from sklearn.linear_model import LinearRegression
from statsmodels.stats.stattools import durbin_watson

dash.register_page(__name__, title='Durbin-Watson test statistic', path='/durbin')


df = pd.read_csv('https://raw.githubusercontent.com/plotly/datasets/master/gapminder_unfiltered.csv')


def fn1(X):
	rand = np.random.normal(0, gaussian_noise, nb_points)
	#print(rand)
	return 40 \
			+ 3*X + rand
			#- 2*(x[1]+np.random.normal(0, gaussian_noise, 1))
			#+ 4*(x[2] + np.random.normal(0, gaussian_noise, 1))

def create_dataset():
    global X_train, y_train

    if add_AR1:
        print("!")
        X_train = np.linspace(0, 50, nb_points).reshape(-1, 1) # X samples of size 1 (from 0 to 50)
        y_train = fn1(X_train.T)[0]
        y_train = addAR1(y_train, phi=phi, sigma=sigma)
    else:
        X_train = np.random.rand(nb_points, 1) * 50 # X samples of size 1 (from 0 to 50)
        y_train = fn1(X_train.T)[0]

    print("(create_dataset) len(x)=", len(X_train), "len(y)=", len(y_train))
    return X_train, y_train

# phi : AR(1) coefficient
# sigma : variance of the error term
def addAR1(y, phi=1, sigma=1):
    
    L = len(y)
    delta = 0  # constant term
    ar1_noise = np.zeros(L)
    ar1_noise[0] = delta  # initialize first value
    eta = np.random.normal(loc=0, scale=sigma, size=L)  # White noise

    # Initialize the first value of AR(1) noise
    ar1_noise[0] = eta[0]

    for t in range(1, L):
        ar1_noise[t] = delta + phi * ar1_noise[t-1] + eta[t]

    y = y + ar1_noise

    print("AR(1) noise :", len(y))
    return y.reshape(-1, 1)




nb_points = 250
gaussian_noise = 10
add_AR1 = False
phi = 0.8
sigma = 0.5

reg = None
residuals = None
X_train = None
y_train = None
X, y = create_dataset()

def linear_reg(X, y):
    global reg
    reg = LinearRegression().fit(X, y)
    score = reg.score(X, y)

    print("number of points:", X.shape[0], "regression score:", round(score, 2), "intercept:", round(reg.intercept_[0], 2), "coef_X1:", round(reg.coef_[0][0], 2))
    return reg

def scatter(ax, X_train, y_train, title=''):
	# Scatter plot
	ax.scatter(X_train, y_train, s=2)
	if title:
		ax.set_title(title)

def computeDW():

    global X, y, reg, residuals

    #
    # Order the data points by X value
    #
    Xs = np.squeeze(X)
    sorted_indices = np.argsort(Xs)
    X = np.array(Xs[sorted_indices]).reshape(-1, 1)
    y = np.array(y[sorted_indices]).reshape(-1, 1)

    reg = linear_reg(X, y)

    residuals = reg.predict(X) - y
    print("residuals:", len(residuals))
    
    DW = durbin_watson(residuals.squeeze()) # info : should be ordered ?
    print("DW=", DW)
    return DW








layout = html.Div([
    
    html.H1(children='🧮 Durbin-Watson test statistic', style={'textAlign':'center', 'textDecoration': 'underline'}),

    #html.Mark('TODO:'),
    #dcc.Checklist(
    #    options=[
    #        {'label': 'Find what to do next !', 'value': 'next'},
    #    ],
    #    value=[]
    #),

    dcc.Markdown(
        children='''
            ### Definition

            The **Durbin-Watson** is a statistical test that was proposed in ***<green>1950</green>***, it detects
            the presence of AR(1) autocorrelation in the residuals ϵ when doing a regression analysis,
            which can lead to biased estimated regression coefficient. It's a quick and easy method,
            but other test may be more relevant, it is considered "archaic" by some (?). Assumption are that
            the residuals are normally distributed with constant variance.

            $DW=\dfrac{\sum\limits_{t=2}^n (\epsilon_t - \epsilon_{t-1})^2}{\sum\limits_{t=1}^n \epsilon_t^2}$

            **DW** ranges <green>**from 0 to 4**</green>, a value of 2 means <u>no-autocorrelation</u> (fail to rejected $H_0$), 0 is <u>positive correlation</u> and 4 is <u>negative</u>.

            see [Wikipedia](https://en.wikipedia.org/wiki/Durbin%E2%80%93Watson_statistic) for more details
        ''',
        mathjax=True,
        dangerously_allow_html=True, # to make <u></u> work ?
        link_target="_blank"
    ),

    html.H3('Settings'),
    html.Div([
        html.Div(children=[
            html.Fieldset(children=[
                html.H5('Gaussian noise :', style={'height': '10px', 'marginTop': '2px', 'marginBottom': '20px'}),
                # added Gaussian noise
                dcc.Slider(min=0, max=30, step=0.5, value=10, marks=None, id='gaussian-noise', tooltip={"placement": "bottom", "always_visible": True}),

                html.H5('Number of points :', style={'height': '10px', 'marginTop': '2px', 'marginBottom': '20px'}),
                # number of points
                dbc.Input(id="input_number", placeholder="Type number of points...", value=250, type="number"),
                html.Br(),

                dcc.Checklist(
                    ['Add AR(1) correlation to data'],
                    [],
                    id='check_ar1',
                ),


                html.H5('Autocorrelation coef (φ) :', style={'height': '10px', 'marginTop': '2px', 'marginBottom': '20px'}),
                # added Gaussian noise
                dcc.Slider(min=0, max=1, step=0.05, value=1, marks=None, id='phi', tooltip={"placement": "bottom", "always_visible": True}),

                html.H5('Std. dev. for white noise (σ) :', style={'height': '10px', 'marginTop': '2px', 'marginBottom': '20px'}),
                # added Gaussian noise
                dcc.Slider(min=0, max=5, step=0.05, value=1, marks=None, id='sigma', tooltip={"placement": "bottom", "always_visible": True}),

            ]),

            html.Br(),
            html.Div(id='slider-output-container', style={'color': 'red', 'fontWeight': 'bold'}),

        ], style={"flex": 1, "padding": "10px"}),
        
        html.Div(children=[
            html.Img(id='dw-image'),
        ], style={"flex": 1, "padding": "10px"}),
    ], style={"display": "flex", "margin-bottom": "10px"}),

    html.H3('Interactive Plotly graph'),
    html.P("Using gapminder dataset (Per year countries population/life expectancy/GDP)"),
    dcc.Dropdown(df.country.unique(), 'Canada', id='dropdown-selection'),
    dcc.Graph(id='graph-content')
])



#
# Callbacks
#

@callback(
    Output('slider-output-container', 'children'),
    Output('dw-image', 'src'), # src attribute
    Input('gaussian-noise', 'value'),
    Input('phi', 'value'),
    Input('sigma', 'value'),
    Input("input_number", "value"),
    Input("check_ar1", "value")
)
def update_output(value, phi_, sigma_, NB_PTS, use_ar1):

    print("fn update_output")
    print("value=", value, "NB_PTS=", NB_PTS, "use_ar1=", use_ar1)

    global gaussian_noise, nb_points, X, y, add_AR1, phi, sigma

    sigma = sigma_
    phi = phi_

    if nb_points != NB_PTS or gaussian_noise != value or len(use_ar1) > 0 != add_AR1 or (len(use_ar1) == 0) == add_AR1:
        nb_points = NB_PTS
        gaussian_noise = value
        add_AR1 = True if len(use_ar1) > 0 else False

        X, y = create_dataset()

    #if add_AR1:
    #    y = addAR1(y, phi=phi, sigma=sigma)

    DW = computeDW()

    global residuals, reg

    fig, ax = plt.subplots(2)
    fig.suptitle('Scatterplot & Residuals')

    scatter(ax[0], X, y)
    ax[0].axline((0, reg.intercept_[0]), slope=reg.coef_[0][0], color='red', label='regression line')
    ax[0].legend()

    scatter(ax[1], X, residuals)

    buf = io.BytesIO() # in-memory files
    plt.savefig(buf, format = "png")
    plt.close()
    data = base64.b64encode(buf.getbuffer()).decode("utf8") # encode to html elements
    buf.close()
    data_ = "data:image/png;base64,{}".format(data)

    print("len(X)=", len(X), "len(Y)=", len(y))

    return 'DW = {}'.format(DW), data_



@callback(
    Output('graph-content', 'figure'),
    Input('dropdown-selection', 'value'))
def update_graph(value):
    dff = df[df.country==value]
    return px.line(dff, x='year', y='pop')
