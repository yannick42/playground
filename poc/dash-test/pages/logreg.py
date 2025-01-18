import dash
from dash import html, dcc, callback, Output, Input
import dash_bootstrap_components as dbc

import joblib
import os

dash.register_page(__name__, title='Logistic Regression', path='/logreg')

featureStyle = {'color': 'blue', 'font-weight': 'bold'}

card_content = [
    html.Span("Gender :", style=featureStyle),
    dcc.RadioItems(
        options=['Male', 'Female'],
        value='Male',
        id='gender',
        #inline=True,
    ),
    html.Span("Age :", style=featureStyle),
    dcc.Slider(min=1, max=130, step=1, value=25, marks=None, id='age', tooltip={"placement": "bottom", "always_visible": True}),
    html.Span("Education :", style=featureStyle),
    dcc.RadioItems(
        options={
            1: '0-11 years',
            2: 'High School Diploma, GED',
            3: 'Some College, Vocational School',
            4: 'College (BS, BA) degree or more',
        },
        value='4',
        id='education',
    ),
    html.Br(),  

    html.H5('Medical condition (behavior) :', style={}),
    html.Div([
        dbc.Switch(
            id="smoker-switch",
            label="Is smoker",
            value=False,
        ),
        dbc.Label("Number of cigarettes per day :"),
        dbc.Input(
            id="cigs-per-day",
            type="number", 
            value=0,
            min=0,
        ),
        dbc.Switch(
            id="has-blood-pressure-med-switch",
            label="Has blood pressure med.",
            value=False,
        ),
        dbc.Switch(
            id="diabetes-switch",
            label="Has diabetes",
            value=False,
        ),
        dbc.Switch(
            id="hypertension-switch",
            label="Has hypertension",
            value=False,
        ),
        dbc.Switch(
            id="had-stroke-switch",
            label="Previously had stroke",
            value=False,
        ),
    ]),
    html.Br(),
    html.H5('Medical condition (current) :', style={}),
    html.Span("Weight (kg) :", style=featureStyle),
    dcc.Slider(min=1, max=200, step=1, value=75, marks=None, id='weight', tooltip={"placement": "bottom", "always_visible": True}),
    html.Span("Height (cm) :", style=featureStyle),
    dcc.Slider(min=1, max=250, step=1, value=177, marks=None, id='height', tooltip={"placement": "bottom", "always_visible": True}),
    html.Span("Heart rate (bpm) :", style=featureStyle),
    dcc.Slider(min=1, max=250, step=1, value=60, marks=None, id='bpm', tooltip={"placement": "bottom", "always_visible": True}),
]

layout = html.Div([
    html.H1('⚠️ WIP: 10 year risk of future coronary heart disease (CHD)'),
    html.Div([
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(dbc.CardBody([
                            html.H5("Please fill in this form", className="card-title"),
                        ] + card_content),
                        color="light",
                        inverse=False
                    ),
                    width=8,
                    style={'padding': '10px'}
                ),
                dbc.Col(
                    dbc.Card([
                        dcc.Markdown(id='result', dangerously_allow_html=True, style={'backgroundColor': '#d7eef6', 'margin': '5px', 'padding': '10px', 'borderRadius': '5px'}),
                    ], color="secondary", inverse=True),
                    width=4,
                )
            ],
            className="mb-2",
        ),
    ]),
])















@callback(
    Output('result', 'children'),
    Input('gender', 'value'),
    Input('age', 'value'),
    Input('education', 'value'),
    Input('weight', 'value'),
    Input('height', 'value'),
    Input('bpm', 'value'),
    Input('smoker-switch', 'value'),
    Input('cigs-per-day', 'value'),
    Input('has-blood-pressure-med-switch', 'value'),
    Input('diabetes-switch', 'value'),
    Input('hypertension-switch', 'value'),
    Input('had-stroke-switch', 'value'),
)
def update_city_selected(gender, age, education, weight, height, bpm, smoker, cigs_per_day, has_medication, diabetes, hypertension, had_stroke):

    male = 1 if gender == 'Male' else 0 # 0 = Female, 1 = Male
    education = int(education)

    # Behaviorial
    currentSmoker = 1 if smoker else 0
    cigsPerDay = cigs_per_day or 0
    # Medical (history)
    BPMeds = 1 if has_medication else 0 # has blood pressure (Anti-hypertensive) medication ?
    prevalentStroke = 1 if had_stroke else 0 # previously had a stroke ?
    prevalentHyp = 1 if hypertension else 0 # was hypertensive ?
    diabetes = 1 if diabetes else 0        # has diabetes ?
    
    # Medical (current)
    BMI = weight / (height / 100)**2  # Body Mass Index (kg / m^2)
    heartRate = bpm      # beats/min




    #
    # Make a prediction !
    #

    # load
    clf = joblib.load(os.getcwd() + "/data/logistic-regression-model-on-framingham-heart-disease-dataset.pkl")

    userData = [male, age, education, currentSmoker, cigsPerDay, BPMeds, prevalentStroke, prevalentHyp, diabetes, BMI, heartRate]
    outputs = clf.predict([userData])
    probas = clf.predict_proba([userData])

    train_data_point = 3227
    nb_features = 11
    nb_all_features = 15
    test_set_accuracy_score = 84.3

    who = f"Using Logistic Regression on {train_data_point} training data points (~80% of the <i>Framingham Heart Study</i> dataset (1948-2018?))"
    if outputs[0] == 0: # NO CHD
        result = f"<mark><b>NO</b></mark>, according to your data, there is a <u><b>{round(probas[0][0]*100, 2)}%</b> confidence level</u> that you <b>do NOT</b> have a"
    else: # CHD
        result = f"⚠️ <mark>YES</mark>, according to your data, there is a <u><b>{round(probas[0][1]*100, 2)}%</b> confidence level</u> that you <b>MAY</b> have a"

    html = ''.join([
        f"<u><b>Prediction :</b></u><br/>",
        f"{result} <i style='color: blue;'>10 year risk of future coronary heart disease (CHD)</i>",
        f"<br/><br/>",
        f"{who}"
        f"<br/><br/>",
        f"Overall <b>test set</b> accuracy was <b>{test_set_accuracy_score}%</b> ... keeping only {nb_features} of {nb_all_features} features",
        f"<br/><br/>",
        f"Your BMI is <b>{round(BMI, 2)}</b>",
    ])

    return f'{html}'
