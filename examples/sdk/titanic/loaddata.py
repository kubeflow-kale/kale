from kale.sdk import step


@step(name="loaddata")
def loaddata():
    import pandas as pd

    data_path = "data/"

    test_df = pd.read_csv(data_path + "test.csv")
    train_df = pd.read_csv(data_path + "train.csv")

    return train_df, test_df
