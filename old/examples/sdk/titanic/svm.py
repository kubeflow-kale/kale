from kale.sdk import step


@step(name="svm")
def svm(train_df, train_labels):
    from sklearn.svm import SVC

    linear_svc = SVC(gamma='auto')
    linear_svc.fit(train_df, train_labels)
    acc_linear_svc = round(linear_svc.score(train_df, train_labels) * 100, 2)
    print("Support Vector Classifier accuracy: %s" % acc_linear_svc)
    return acc_linear_svc
