import os

INPUTS = ["CLOUD_COVER", "DEWPOINT", "HEAT_INDEX", "TEMPERATURE", "WIND_CHILL",
          "WIND_DIRECTION", "WIND_SPEED", "TOTAL_CAP_GEN_RES",
          "TOTAL_CAP_LOAD_RES", "AVERAGE", "total_load", "DA_PRICE"]
OUTPUTS = ["response_var"]
DATE_TIME = "DateTime"

_DATA_FOLDER = "./data"
_TRAIN_DATA_FILE = "TrainingData.csv"
_TEST_DATA_FILE = "TestData.csv"
_OUTPUT_FILE = "outputTrainingData_qr.csv"
TRAINING_DATA = os.path.join(_DATA_FOLDER, _TRAIN_DATA_FILE)
TEST_DATA = os.path.join(_DATA_FOLDER, _TEST_DATA_FILE)
OUTPUT_DATA = os.path.join(_DATA_FOLDER, _OUTPUT_FILE)

MODEL_SETTINGS = {
    "q": 0.5,
    "max_iter": 5000
}
