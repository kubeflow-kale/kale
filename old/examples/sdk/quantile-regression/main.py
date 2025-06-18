from kale.sdk import pipeline


from init import init
from preprocess import preprocess
from train import train_and_predict
from postprocess import postprocess


@pipeline(
    name="quantile-regression",
    experiment="quantile-regression",
    autosnapshot=False,
)
def quantile_regression():
    df = init()
    raw_input, processing_info = preprocess(df)
    raw_predictions = train_and_predict(raw_input)
    postprocess(raw_input, raw_predictions, processing_info)


if __name__ == "__main__":
    quantile_regression()
