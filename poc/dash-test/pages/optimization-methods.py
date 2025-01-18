import dash
from dash import html, dcc, callback, Output, Input
import dash_bootstrap_components as dbc

import io
import base64

from .opt import compute, visualize

dash.register_page(__name__, title='Optimization methods', path='/opt')





compute()






layout = html.Div(children=[
    html.H3('Optimization methods'),
    dcc.Dropdown(
        ['gd', 'cgd', 'momentum', 'nesterov_momentum', 'adagrad', 'dfp', 'bfgs'],
        ['gd', 'cgd', 'momentum', 'nesterov_momentum', 'adagrad', 'dfp', 'bfgs'],
        id='methods',
        multi=True,
    ),
    html.Br(),
    html.Img(id='plot'),
])

@callback(
    Output('plot', 'src'),
    Input('methods', 'value'),
)
def update(methods):
    
    plt = visualize(methods)
    plt.show()
    
    buf = io.BytesIO() # in-memory files
    plt.savefig(buf, format = "png")
    plt.close()
    data = base64.b64encode(buf.getbuffer()).decode("utf8") # encode to html elements
    buf.close()
    dataImage = "data:image/png;base64,{}".format(data)

    return dataImage