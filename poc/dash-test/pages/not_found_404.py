import dash
from dash import html
import dash_bootstrap_components as dbc

from .side_bar import sidebar

dash.register_page(__name__)

layout = html.H1("404: Please, choose a topic in the sidebar")
