from kale.sdk import pipeline

# data functions
from loaddata import loaddata
from feature_engineering import featureengineering
from datapreprocessing import dataprocessing

# models
from svm import svm
from randomforest import randomforest
from logistic_regression import logistic_regression

# end
from results import results


@pipeline(
    name="titanic",
    experiment="test"
)
def titanic_pipeline():
    train, test = loaddata()
    train_proc, test_proc = dataprocessing(train, test)
    train_feat, train_labels = featureengineering(train_proc, test_proc)

    rf_acc = randomforest(train_feat, train_labels)
    svm_acc = svm(train_feat, train_labels)
    lg_acc = logistic_regression(train_feat, train_labels)

    results(svm_acc, lg_acc, rf_acc)


if __name__ == "__main__":
    titanic_pipeline()
