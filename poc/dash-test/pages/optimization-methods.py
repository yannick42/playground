import dash
from dash import html, dcc, callback, Output, Input, no_update
import dash_bootstrap_components as dbc

import io
import base64

from .opt import compute, visualize

dash.register_page(__name__, title='Optimization methods', path='/opt')

layout = html.Div(children=[
    html.H3('Optimization methods'),
    dbc.Button("New random starting point", id="reload", color="primary", className="me-1", n_clicks=0, style={'marginBottom': '10px'}),
    html.Div('Optimization methods :'),
    dcc.Dropdown(
        [
            {'label': 'Gradient descent', 'value': 'gd'}, #, 'className': 'test-1'}, not available ? https://github.com/plotly/dash/issues/1796
            {'label': 'Conjugate gradient descent', 'value': 'cgd'},
            {'label': 'Momentum', 'value': 'momentum'},
            {'label': 'Nesterov momentum', 'value': 'nesterov_momentum'},
            {'label': 'AdaGrad', 'value': 'adagrad'},
            {'label': 'Davidon-Fletcher-Powell', 'value': 'dfp'},
            {'label': 'BFGS', 'value': 'bfgs'},
        ],
        ['gd', 'cgd', 'momentum', 'dfp', 'bfgs'],
        id='methods',
        multi=True,
    ),
    dcc.Dropdown(
        [
            {'label': 'Rosenbruck\'s function', 'value': 'rosenbrock'},
            {'label': 'Sphere function', 'value': 'sphere'},
            {'label': 'Ackley function', 'value': 'ackley'},
        ],
        "rosenbrock",
        id='function'
    ),
    html.Br(),
    dcc.Loading(
        id="loading-2",
        children=[html.Img(id='plot', style={'height': '600px'})],
        type="circle",
        overlay_style={"visibility":"visible", "filter": "blur(2px)"},
    ),
])


current_n_clicks = 0

@callback(
    Output('plot', 'src'),
    Input('methods', 'value'),
    Input('function', 'value'),
    Input('reload', 'n_clicks'),
)
def update(methods, test_function, n_clicks):
    
    try:
        global current_n_clicks
        
        change_start = True if n_clicks != current_n_clicks else False
        print(f"change starting point ? {change_start}")

        current_n_clicks = n_clicks

        # slow
        compute(methods, test_function, change_start)
        # 
        plt = visualize(methods, test_function)
        plt.show()
        
        buf = io.BytesIO() # in-memory files
        plt.savefig(buf, format = "png")
        plt.close()
        data = base64.b64encode(buf.getbuffer()).decode("utf8") # encode to html elements
        buf.close()
        dataImage = "data:image/png;base64,{}".format(data)

        return dataImage
    except Exception as inst:
        print(type(inst))
        print(inst)
        return no_update, "error when computing results..."