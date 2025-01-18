import dash_bootstrap_components as dbc
import dash
from dash import Dash, html, dcc

app = Dash(
    __name__,
    use_pages=True,
    title='Web data apps',
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    prevent_initial_callbacks=True,
    suppress_callback_exceptions=True,
)

app.layout = [
    html.Div([
        html.H6(f"Available pages ({len(dash.page_registry.values())}) :"),
        html.Ul([
            html.Li(
                dcc.Link(f"{page['title']}", href=page["relative_path"])
            ) for page in dash.page_registry.values()
        ]),
        html.Hr(),
        dash.page_container,
    ]),
    #html.Img(src='/assets/image.png'),
]

server = app.server

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8000, use_reloader=False)
