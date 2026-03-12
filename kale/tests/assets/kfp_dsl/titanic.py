from collections import OrderedDict
import json

import kfp.components as _kfp_components
import kfp.dsl as _kfp_dsl
from kubernetes import client as k8s_client


def loaddata():



    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    path = "data/"

    PREDICTION_LABEL = 'Survived'

    test_df = pd.read_csv(path + "test.csv")
    train_df = pd.read_csv(path + "train.csv")
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(PREDICTION_LABEL, "PREDICTION_LABEL")
    _kale_marshal.save(test_df, "test_df")
    _kale_marshal.save(train_df, "train_df")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (
        _kale_block1,
        _kale_block2,
        _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/loaddata.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('loaddata')




def datapreprocessing():



    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    test_df = _kale_marshal.load("test_df")
    train_df = _kale_marshal.load("train_df")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    data = [train_df, test_df]
    for dataset in data:
        dataset['relatives'] = dataset['SibSp'] + dataset['Parch']
        dataset.loc[dataset['relatives'] > 0, 'not_alone'] = 0
        dataset.loc[dataset['relatives'] == 0, 'not_alone'] = 1
        dataset['not_alone'] = dataset['not_alone'].astype(int)
    train_df['not_alone'].value_counts()
    '''

    _kale_block3 = '''
    # This does not contribute to a person survival probability
    train_df = train_df.drop(['PassengerId'], axis=1)
    '''

    _kale_block4 = '''
    import re
    deck = {"A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 6, "G": 7, "U": 8}
    data = [train_df, test_df]

    for dataset in data:
        dataset['Cabin'] = dataset['Cabin'].fillna("U0")
        dataset['Deck'] = dataset['Cabin'].map(lambda x: re.compile("([a-zA-Z]+)").search(x).group())
        dataset['Deck'] = dataset['Deck'].map(deck)
        dataset['Deck'] = dataset['Deck'].fillna(0)
        dataset['Deck'] = dataset['Deck'].astype(int)
    # we can now drop the cabin feature
    train_df = train_df.drop(['Cabin'], axis=1)
    test_df = test_df.drop(['Cabin'], axis=1)
    '''

    _kale_block5 = '''
    data = [train_df, test_df]

    for dataset in data:
        mean = train_df["Age"].mean()
        std = test_df["Age"].std()
        is_null = dataset["Age"].isnull().sum()
        # compute random numbers between the mean, std and is_null
        rand_age = np.random.randint(mean - std, mean + std, size = is_null)
        # fill NaN values in Age column with random values generated
        age_slice = dataset["Age"].copy()
        age_slice[np.isnan(age_slice)] = rand_age
        dataset["Age"] = age_slice
        dataset["Age"] = train_df["Age"].astype(int)
    train_df["Age"].isnull().sum()
    '''

    _kale_block6 = '''
    train_df['Embarked'].describe()
    '''

    _kale_block7 = '''
    # fill with most common value
    common_value = 'S'
    data = [train_df, test_df]

    for dataset in data:
        dataset['Embarked'] = dataset['Embarked'].fillna(common_value)
    '''

    _kale_block8 = '''
    train_df.info()
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(test_df, "test_df")
    _kale_marshal.save(train_df, "train_df")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_block3,
                    _kale_block4,
                    _kale_block5,
                    _kale_block6,
                    _kale_block7,
                    _kale_block8,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/datapreprocessing.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('datapreprocessing')




def featureengineering():



    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    PREDICTION_LABEL = _kale_marshal.load("PREDICTION_LABEL")
    test_df = _kale_marshal.load("test_df")
    train_df = _kale_marshal.load("train_df")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    data = [train_df, test_df]

    for dataset in data:
        dataset['Fare'] = dataset['Fare'].fillna(0)
        dataset['Fare'] = dataset['Fare'].astype(int)
    '''

    _kale_block3 = '''
    data = [train_df, test_df]
    titles = {"Mr": 1, "Miss": 2, "Mrs": 3, "Master": 4, "Rare": 5}

    for dataset in data:
        # extract titles
        dataset['Title'] = dataset.Name.str.extract(' ([A-Za-z]+)\\.', expand=False)
        # replace titles with a more common title or as Rare
        dataset['Title'] = dataset['Title'].replace(['Lady', 'Countess','Capt', 'Col','Don', 'Dr',\\
                                                'Major', 'Rev', 'Sir', 'Jonkheer', 'Dona'], 'Rare')
        dataset['Title'] = dataset['Title'].replace('Mlle', 'Miss')
        dataset['Title'] = dataset['Title'].replace('Ms', 'Miss')
        dataset['Title'] = dataset['Title'].replace('Mme', 'Mrs')
        # convert titles into numbers
        dataset['Title'] = dataset['Title'].map(titles)
        # filling NaN with 0, to get safe
        dataset['Title'] = dataset['Title'].fillna(0)
    train_df = train_df.drop(['Name'], axis=1)
    test_df = test_df.drop(['Name'], axis=1)
    '''

    _kale_block4 = '''
    genders = {"male": 0, "female": 1}
    data = [train_df, test_df]

    for dataset in data:
        dataset['Sex'] = dataset['Sex'].map(genders)
    '''

    _kale_block5 = '''
    train_df = train_df.drop(['Ticket'], axis=1)
    test_df = test_df.drop(['Ticket'], axis=1)
    '''

    _kale_block6 = '''
    ports = {"S": 0, "C": 1, "Q": 2}
    data = [train_df, test_df]

    for dataset in data:
        dataset['Embarked'] = dataset['Embarked'].map(ports)
    '''

    _kale_block7 = '''
    data = [train_df, test_df]
    for dataset in data:
        dataset['Age'] = dataset['Age'].astype(int)
        dataset.loc[ dataset['Age'] <= 11, 'Age'] = 0
        dataset.loc[(dataset['Age'] > 11) & (dataset['Age'] <= 18), 'Age'] = 1
        dataset.loc[(dataset['Age'] > 18) & (dataset['Age'] <= 22), 'Age'] = 2
        dataset.loc[(dataset['Age'] > 22) & (dataset['Age'] <= 27), 'Age'] = 3
        dataset.loc[(dataset['Age'] > 27) & (dataset['Age'] <= 33), 'Age'] = 4
        dataset.loc[(dataset['Age'] > 33) & (dataset['Age'] <= 40), 'Age'] = 5
        dataset.loc[(dataset['Age'] > 40) & (dataset['Age'] <= 66), 'Age'] = 6
        dataset.loc[ dataset['Age'] > 66, 'Age'] = 6

    # let's see how it's distributed train_df['Age'].value_counts()
    '''

    _kale_block8 = '''
    data = [train_df, test_df]

    for dataset in data:
        dataset.loc[ dataset['Fare'] <= 7.91, 'Fare'] = 0
        dataset.loc[(dataset['Fare'] > 7.91) & (dataset['Fare'] <= 14.454), 'Fare'] = 1
        dataset.loc[(dataset['Fare'] > 14.454) & (dataset['Fare'] <= 31), 'Fare']   = 2
        dataset.loc[(dataset['Fare'] > 31) & (dataset['Fare'] <= 99), 'Fare']   = 3
        dataset.loc[(dataset['Fare'] > 99) & (dataset['Fare'] <= 250), 'Fare']   = 4
        dataset.loc[ dataset['Fare'] > 250, 'Fare'] = 5
        dataset['Fare'] = dataset['Fare'].astype(int)
    '''

    _kale_block9 = '''
    data = [train_df, test_df]
    for dataset in data:
        dataset['Age_Class']= dataset['Age']* dataset['Pclass']
    '''

    _kale_block10 = '''
    for dataset in data:
        dataset['Fare_Per_Person'] = dataset['Fare']/(dataset['relatives']+1)
        dataset['Fare_Per_Person'] = dataset['Fare_Per_Person'].astype(int)
    # Let's take a last look at the training set, before we start training the models.
    train_df.head(10)
    '''

    _kale_block11 = '''
    train_labels = train_df[PREDICTION_LABEL]
    train_df = train_df.drop(PREDICTION_LABEL, axis=1)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(train_df, "train_df")
    _kale_marshal.save(train_labels, "train_labels")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_block3,
                    _kale_block4,
                    _kale_block5,
                    _kale_block6,
                    _kale_block7,
                    _kale_block8,
                    _kale_block9,
                    _kale_block10,
                    _kale_block11,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/featureengineering.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('featureengineering')




def decisiontree():



    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    train_df = _kale_marshal.load("train_df")
    train_labels = _kale_marshal.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    decision_tree = DecisionTreeClassifier()
    decision_tree.fit(train_df, train_labels)
    acc_decision_tree = round(decision_tree.score(train_df, train_labels) * 100, 2)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(acc_decision_tree, "acc_decision_tree")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/decisiontree.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('decisiontree')




def svm():



    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    train_df = _kale_marshal.load("train_df")
    train_labels = _kale_marshal.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    linear_svc = SVC(gamma='auto')
    linear_svc.fit(train_df, train_labels)
    acc_linear_svc = round(linear_svc.score(train_df, train_labels) * 100, 2)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(acc_linear_svc, "acc_linear_svc")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/svm.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('svm')




def naivebayes():



    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    train_df = _kale_marshal.load("train_df")
    train_labels = _kale_marshal.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    gaussian = GaussianNB()
    gaussian.fit(train_df, train_labels)
    acc_gaussian = round(gaussian.score(train_df, train_labels) * 100, 2)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(acc_gaussian, "acc_gaussian")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/naivebayes.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('naivebayes')




def logisticregression():



    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    train_df = _kale_marshal.load("train_df")
    train_labels = _kale_marshal.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    logreg = LogisticRegression(solver='lbfgs', max_iter=110)
    logreg.fit(train_df, train_labels)
    acc_log = round(logreg.score(train_df, train_labels) * 100, 2)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(acc_log, "acc_log")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/logisticregression.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('logisticregression')




def randomforest():


    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    train_df = _kale_marshal.load("train_df")
    train_labels = _kale_marshal.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    random_forest = RandomForestClassifier(n_estimators=100)
    random_forest.fit(train_df, train_labels)
    acc_random_forest = round(random_forest.score(train_df, train_labels) * 100, 2)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(acc_random_forest, "acc_random_forest")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/randomforest.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('randomforest')




def results():


    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    acc_decision_tree = _kale_marshal.load("acc_decision_tree")
    acc_gaussian = _kale_marshal.load("acc_gaussian")
    acc_linear_svc = _kale_marshal.load("acc_linear_svc")
    acc_log = _kale_marshal.load("acc_log")
    acc_random_forest = _kale_marshal.load("acc_random_forest")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib import style

    from sklearn import linear_model
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import Perceptron
    from sklearn.linear_model import SGDClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    '''

    _kale_block2 = '''
    results = pd.DataFrame({
        'Model': ['Support Vector Machines', 'logistic Regression',
                  'Random Forest', 'Naive Bayes', 'Decision Tree'],
        'Score': [acc_linear_svc, acc_log,
                  acc_random_forest, acc_gaussian, acc_decision_tree]})
    result_df = results.sort_values(by='Score', ascending=False)
    result_df = result_df.set_index('Score')
    print(result_df)
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    )
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/results.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('results')




_kale_loaddata_op = _kfp_components.func_to_container_op(loaddata)


_kale_datapreprocessing_op = _kfp_components.func_to_container_op(
    datapreprocessing)


_kale_featureengineering_op = _kfp_components.func_to_container_op(
    featureengineering)


_kale_decisiontree_op = _kfp_components.func_to_container_op(decisiontree)


_kale_svm_op = _kfp_components.func_to_container_op(svm)


_kale_naivebayes_op = _kfp_components.func_to_container_op(naivebayes)


_kale_logisticregression_op = _kfp_components.func_to_container_op(
    logisticregression)


_kale_randomforest_op = _kfp_components.func_to_container_op(randomforest)


_kale_results_op = _kfp_components.func_to_container_op(results)


@_kfp_dsl.pipeline(
    name='titanic-ml',
    description='Predict which passengers survived the Titanic shipwreck'
)
def auto_generated_pipeline():
    _kale_pvolumes_dict = OrderedDict()
    _kale_volume_step_names = []
    _kale_volume_name_parameters = []

    _kale_marshal_vop = _kfp_dsl.VolumeOp(
        name="kale-marshal-volume",
        resource_name="kale-marshal-pvc",
        modes=['ReadWriteMany'],
        size="1Gi"
    )
    _kale_volume_step_names.append(_kale_marshal_vop.name)
    _kale_volume_name_parameters.append(
        _kale_marshal_vop.outputs["name"].full_name)
    _kale_pvolumes_dict['/marshal'] = _kale_marshal_vop.volume

    _kale_volume_step_names.sort()
    _kale_volume_name_parameters.sort()

    _kale_loaddata_task = _kale_loaddata_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after()
    _kale_loaddata_task.container.working_dir = "/kale"
    _kale_loaddata_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'loaddata': '/loaddata.html'})
    _kale_loaddata_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_loaddata_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_loaddata_task.dependent_names +
                       _kale_volume_step_names)
    _kale_loaddata_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_loaddata_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_datapreprocessing_task = _kale_datapreprocessing_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_loaddata_task)
    _kale_datapreprocessing_task.container.working_dir = "/kale"
    _kale_datapreprocessing_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update(
        {'datapreprocessing': '/datapreprocessing.html'})
    _kale_datapreprocessing_task.output_artifact_paths.update(
        _kale_output_artifacts)
    _kale_datapreprocessing_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_datapreprocessing_task.dependent_names +
                       _kale_volume_step_names)
    _kale_datapreprocessing_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_datapreprocessing_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_featureengineering_task = _kale_featureengineering_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_datapreprocessing_task)
    _kale_featureengineering_task.container.working_dir = "/kale"
    _kale_featureengineering_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update(
        {'featureengineering': '/featureengineering.html'})
    _kale_featureengineering_task.output_artifact_paths.update(
        _kale_output_artifacts)
    _kale_featureengineering_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_featureengineering_task.dependent_names +
                       _kale_volume_step_names)
    _kale_featureengineering_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_featureengineering_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_decisiontree_task = _kale_decisiontree_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_featureengineering_task)
    _kale_decisiontree_task.container.working_dir = "/kale"
    _kale_decisiontree_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'decisiontree': '/decisiontree.html'})
    _kale_decisiontree_task.output_artifact_paths.update(
        _kale_output_artifacts)
    _kale_decisiontree_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_decisiontree_task.dependent_names +
                       _kale_volume_step_names)
    _kale_decisiontree_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_decisiontree_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_svm_task = _kale_svm_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_featureengineering_task)
    _kale_svm_task.container.working_dir = "/kale"
    _kale_svm_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'svm': '/svm.html'})
    _kale_svm_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_svm_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_svm_task.dependent_names +
                       _kale_volume_step_names)
    _kale_svm_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_svm_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_naivebayes_task = _kale_naivebayes_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_featureengineering_task)
    _kale_naivebayes_task.container.working_dir = "/kale"
    _kale_naivebayes_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'naivebayes': '/naivebayes.html'})
    _kale_naivebayes_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_naivebayes_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_naivebayes_task.dependent_names +
                       _kale_volume_step_names)
    _kale_naivebayes_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_naivebayes_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_logisticregression_task = _kale_logisticregression_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_featureengineering_task)
    _kale_logisticregression_task.container.working_dir = "/kale"
    _kale_logisticregression_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update(
        {'logisticregression': '/logisticregression.html'})
    _kale_logisticregression_task.output_artifact_paths.update(
        _kale_output_artifacts)
    _kale_logisticregression_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_logisticregression_task.dependent_names +
                       _kale_volume_step_names)
    _kale_logisticregression_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_logisticregression_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_randomforest_task = _kale_randomforest_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_featureengineering_task)
    _kale_randomforest_task.container.working_dir = "/kale"
    _kale_randomforest_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'randomforest': '/randomforest.html'})
    _kale_randomforest_task.output_artifact_paths.update(
        _kale_output_artifacts)
    _kale_randomforest_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_randomforest_task.dependent_names +
                       _kale_volume_step_names)
    _kale_randomforest_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_randomforest_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_results_task = _kale_results_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_randomforest_task, _kale_logisticregression_task, _kale_naivebayes_task, _kale_svm_task, _kale_decisiontree_task)
    _kale_results_task.container.working_dir = "/kale"
    _kale_results_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'results': '/results.html'})
    _kale_results_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_results_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_results_task.dependent_names +
                       _kale_volume_step_names)
    _kale_results_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_results_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))


if __name__ == "__main__":
    pipeline_func = auto_generated_pipeline
    pipeline_filename = pipeline_func.__name__ + '.pipeline.tar.gz'
    import kfp.compiler as compiler
    compiler.Compiler().compile(pipeline_func, pipeline_filename)

    # Get or create an experiment and submit a pipeline run
    import kfp
    client = kfp.Client()
    experiment = client.create_experiment('titanic')

    # Submit a pipeline run
    from kale.common import kfputils
    pipeline_id, version_id = kfputils.upload_pipeline(
        pipeline_filename, "titanic-ml")
    run_result = kfputils.run_pipeline(
        experiment_name=experiment.name, pipeline_id=pipeline_id, version_id=version_id)
