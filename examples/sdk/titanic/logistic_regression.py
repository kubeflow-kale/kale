from kale.sdk import step


@step(name="logisticregression")
def logistic_regression(train_df, train_labels):
    from sklearn.linear_model import LogisticRegression

    logreg = LogisticRegression(solver='lbfgs', max_iter=110)
    logreg.fit(train_df, train_labels)
    acc_log = round(logreg.score(train_df, train_labels) * 100, 2)
    print("Logistic Regression: %s" % acc_log)
    return acc_log



