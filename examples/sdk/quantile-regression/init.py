from kale.sdk import step


@step(name="init")
def init():
    import pandas as pd
    from settings import TRAINING_DATA

    df = pd.read_csv(TRAINING_DATA)

    return df
