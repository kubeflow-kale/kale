from kale.sdk import step


@step(name="randomforest")
def randomforest(train_df, train_labels):
    from sklearn.ensemble import RandomForestClassifier

    random_forest = RandomForestClassifier(n_estimators=100)
    random_forest.fit(train_df, train_labels)
    acc_random_forest = round(random_forest.score(train_df, train_labels) * 100, 2)
    print("Random Forest accuracy: %s" % acc_random_forest)
    return acc_random_forest
