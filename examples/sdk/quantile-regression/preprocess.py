from kale.sdk import step


@step(name="preprocess")
def preprocess(df):
    import pandas as pd
    import numpy as np

    from settings import INPUTS, OUTPUTS, DATE_TIME

    print("Preprocessing data")

    processing_info = {}

    # get labels
    output = OUTPUTS[0]

    X = df[INPUTS].values

    var_time = DATE_TIME
    if len(var_time) > 0:
        df[var_time] = pd.to_datetime(df[var_time])
        Time = df[var_time].values
    else:
        Time = np.array([])

    if 'scaling' in processing_info:
        shift_x, scale_x = processing_info['scaling']

    else:
        # must be training case
        shift_x = np.mean(X,
                          axis=0)

        scale_x = np.std(X,
                         axis=0,
                         keepdims=True)

        processing_info['scaling'] = [shift_x, scale_x]

    Xraw = (X - shift_x) / scale_x

    if len(Xraw.shape) == 1:
        Xraw = Xraw[:, None]

    if output in df.columns.tolist():  # in prediction case output variable
        # might not be present
        Yraw = df[output].values
    else:
        Yraw = np.array([])

    raw_input = [Xraw, Yraw, Time]
    return raw_input, processing_info
