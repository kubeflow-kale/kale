from kale.sdk import step


@step(name="trainpredict")
def train_and_predict(raw_input):
    from lib.quantile_regression import QuantileRegression

    from settings import MODEL_SETTINGS

    model = QuantileRegression(raw_input, MODEL_SETTINGS)
    print("Running training")
    model.training(raw_input, MODEL_SETTINGS)

    print("Running prediction")
    return model.predict(raw_input, MODEL_SETTINGS)
