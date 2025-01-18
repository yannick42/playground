import dash
from dash import html
import dash_bootstrap_components as dbc

def sidebar():
    return html.Div([
        html.H6(f"Available pages ({len(dash.page_registry.values()) - 1}) :"),
        dbc.Nav(
            [
                dbc.NavLink(
                    html.Div(page["title"], className="ms-2"),
                    href=page["path"],
                    active="exact",
                )
                for page in dash.page_registry.values()
                if not (page["path"].startswith("/not-found") or page["path"].startswith("/side_bar"))
            ],
            vertical=True,
            pills=True,
            className="bg-light",
        )
    ])