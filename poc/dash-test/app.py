import dash_bootstrap_components as dbc
import dash
from dash import Dash, html, dcc

from pages.side_bar import sidebar

app = Dash(
    __name__,
    use_pages=True,
    title='Web data apps',
    pages_folder='pages', # default
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    #prevent_initial_callbacks=True,
    #suppress_callback_exceptions=True,
)
server = app.server

app.layout = dbc.Row([
    dbc.Col(sidebar(), width=2),
    dbc.Col(children=[
        html.Div([
            #html.Ul([
            #    html.Li(
            #        dcc.Link(f"{page['title']}", href=page["relative_path"])
            #    ) for page in dash.page_registry.values()
            #]),
            #html.Hr(),
            dash.page_container,
        ]),
        #html.Img(src='/assets/image.png'),
    ])
])

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000, use_reloader=True)
