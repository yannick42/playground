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
    dcc.Dropdown(
        ['gd', 'cgd', 'momentum', 'nesterov_momentum', 'adagrad', 'dfp', 'bfgs'],
        ['gd', 'cgd', 'momentum', 'dfp', 'bfgs'],
        id='methods',
        multi=True,
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
    Input('reload', 'n_clicks'),
)
def update(methods, n_clicks):
    
    try:
        global current_n_clicks
        
        change_start = True if n_clicks != current_n_clicks else False
        print(f"change starting point ? {change_start}")

        current_n_clicks = n_clicks

        # slow
        compute(methods, change_start)
        # 
        plt = visualize(methods)
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