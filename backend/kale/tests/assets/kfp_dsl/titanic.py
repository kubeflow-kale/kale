import kfp.dsl as dsl
import json
import kfp.components as comp
from collections import OrderedDict
from kubernetes import client as k8s_client


def loaddata():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    block1 = '''
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

    block2 = '''
    path = "data/"

    PREDICTION_LABEL = 'Survived'

    test_df = pd.read_csv(path + "test.csv")
    train_df = pd.read_csv(path + "train.csv")
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(PREDICTION_LABEL, "PREDICTION_LABEL")
    _kale_marshal_utils.save(test_df, "test_df")
    _kale_marshal_utils.save(train_df, "train_df")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (
        block1,
        block2,
        data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/loaddata.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('loaddata')

    _kale_mlmdutils.call("mark_execution_complete")


def datapreprocessing():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    test_df = _kale_marshal_utils.load("test_df")
    train_df = _kale_marshal_utils.load("train_df")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
    data = [train_df, test_df]
    for dataset in data:
        dataset['relatives'] = dataset['SibSp'] + dataset['Parch']
        dataset.loc[dataset['relatives'] > 0, 'not_alone'] = 0
        dataset.loc[dataset['relatives'] == 0, 'not_alone'] = 1
        dataset['not_alone'] = dataset['not_alone'].astype(int)
    train_df['not_alone'].value_counts()
    '''

    block3 = '''
    # This does not contribute to a person survival probability
    train_df = train_df.drop(['PassengerId'], axis=1)
    '''

    block4 = '''
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

    block5 = '''
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

    block6 = '''
    train_df['Embarked'].describe()
    '''

    block7 = '''
    # fill with most common value
    common_value = 'S'
    data = [train_df, test_df]

    for dataset in data:
        dataset['Embarked'] = dataset['Embarked'].fillna(common_value)
    '''

    block8 = '''
    train_df.info()
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(test_df, "test_df")
    _kale_marshal_utils.save(train_df, "train_df")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              block3,
              block4,
              block5,
              block6,
              block7,
              block8,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/datapreprocessing.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('datapreprocessing')

    _kale_mlmdutils.call("mark_execution_complete")


def featureengineering():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    PREDICTION_LABEL = _kale_marshal_utils.load("PREDICTION_LABEL")
    test_df = _kale_marshal_utils.load("test_df")
    train_df = _kale_marshal_utils.load("train_df")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
    data = [train_df, test_df]

    for dataset in data:
        dataset['Fare'] = dataset['Fare'].fillna(0)
        dataset['Fare'] = dataset['Fare'].astype(int)
    '''

    block3 = '''
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

    block4 = '''
    genders = {"male": 0, "female": 1}
    data = [train_df, test_df]

    for dataset in data:
        dataset['Sex'] = dataset['Sex'].map(genders)
    '''

    block5 = '''
    train_df = train_df.drop(['Ticket'], axis=1)
    test_df = test_df.drop(['Ticket'], axis=1)
    '''

    block6 = '''
    ports = {"S": 0, "C": 1, "Q": 2}
    data = [train_df, test_df]

    for dataset in data:
        dataset['Embarked'] = dataset['Embarked'].map(ports)
    '''

    block7 = '''
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

    block8 = '''
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

    block9 = '''
    data = [train_df, test_df]
    for dataset in data:
        dataset['Age_Class']= dataset['Age']* dataset['Pclass']
    '''

    block10 = '''
    for dataset in data:
        dataset['Fare_Per_Person'] = dataset['Fare']/(dataset['relatives']+1)
        dataset['Fare_Per_Person'] = dataset['Fare_Per_Person'].astype(int)
    # Let's take a last look at the training set, before we start training the models.
    train_df.head(10)
    '''

    block11 = '''
    train_labels = train_df[PREDICTION_LABEL]
    train_df = train_df.drop(PREDICTION_LABEL, axis=1)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(train_df, "train_df")
    _kale_marshal_utils.save(train_labels, "train_labels")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              block3,
              block4,
              block5,
              block6,
              block7,
              block8,
              block9,
              block10,
              block11,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/featureengineering.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('featureengineering')

    _kale_mlmdutils.call("mark_execution_complete")


def decisiontree():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    train_df = _kale_marshal_utils.load("train_df")
    train_labels = _kale_marshal_utils.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
    decision_tree = DecisionTreeClassifier()
    decision_tree.fit(train_df, train_labels)
    acc_decision_tree = round(decision_tree.score(train_df, train_labels) * 100, 2)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(acc_decision_tree, "acc_decision_tree")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/decisiontree.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('decisiontree')

    _kale_mlmdutils.call("mark_execution_complete")


def svm():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    train_df = _kale_marshal_utils.load("train_df")
    train_labels = _kale_marshal_utils.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
    linear_svc = SVC(gamma='auto')
    linear_svc.fit(train_df, train_labels)
    acc_linear_svc = round(linear_svc.score(train_df, train_labels) * 100, 2)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(acc_linear_svc, "acc_linear_svc")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/svm.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('svm')

    _kale_mlmdutils.call("mark_execution_complete")


def naivebayes():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    train_df = _kale_marshal_utils.load("train_df")
    train_labels = _kale_marshal_utils.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
    gaussian = GaussianNB()
    gaussian.fit(train_df, train_labels)
    acc_gaussian = round(gaussian.score(train_df, train_labels) * 100, 2)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(acc_gaussian, "acc_gaussian")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/naivebayes.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('naivebayes')

    _kale_mlmdutils.call("mark_execution_complete")


def logisticregression():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    train_df = _kale_marshal_utils.load("train_df")
    train_labels = _kale_marshal_utils.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
    logreg = LogisticRegression(solver='lbfgs', max_iter=110)
    logreg.fit(train_df, train_labels)
    acc_log = round(logreg.score(train_df, train_labels) * 100, 2)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(acc_log, "acc_log")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/logisticregression.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('logisticregression')

    _kale_mlmdutils.call("mark_execution_complete")


def randomforest():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    train_df = _kale_marshal_utils.load("train_df")
    train_labels = _kale_marshal_utils.load("train_labels")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
    random_forest = RandomForestClassifier(n_estimators=100)
    random_forest.fit(train_df, train_labels)
    acc_random_forest = round(random_forest.score(train_df, train_labels) * 100, 2)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(acc_random_forest, "acc_random_forest")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/randomforest.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('randomforest')

    _kale_mlmdutils.call("mark_execution_complete")


def results():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    acc_decision_tree = _kale_marshal_utils.load("acc_decision_tree")
    acc_gaussian = _kale_marshal_utils.load("acc_gaussian")
    acc_linear_svc = _kale_marshal_utils.load("acc_linear_svc")
    acc_log = _kale_marshal_utils.load("acc_log")
    acc_random_forest = _kale_marshal_utils.load("acc_random_forest")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
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

    block2 = '''
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
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              block1,
              block2,
              )
    html_artifact = _kale_run_code(blocks)
    with open("/results.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('results')

    _kale_mlmdutils.call("mark_execution_complete")


loaddata_op = comp.func_to_container_op(loaddata)


datapreprocessing_op = comp.func_to_container_op(datapreprocessing)


featureengineering_op = comp.func_to_container_op(featureengineering)


decisiontree_op = comp.func_to_container_op(decisiontree)


svm_op = comp.func_to_container_op(svm)


naivebayes_op = comp.func_to_container_op(naivebayes)


logisticregression_op = comp.func_to_container_op(logisticregression)


randomforest_op = comp.func_to_container_op(randomforest)


results_op = comp.func_to_container_op(results)


@dsl.pipeline(
    name='titanic-ml-rnd',
    description='Predict which passengers survived the Titanic shipwreck'
)
def auto_generated_pipeline():
    pvolumes_dict = OrderedDict()
    volume_step_names = []
    volume_name_parameters = []

    marshal_vop = dsl.VolumeOp(
        name="kale-marshal-volume",
        resource_name="kale-marshal-pvc",
        modes=dsl.VOLUME_MODE_RWM,
        size="1Gi"
    )
    volume_step_names.append(marshal_vop.name)
    volume_name_parameters.append(marshal_vop.outputs["name"].full_name)
    pvolumes_dict['/marshal'] = marshal_vop.volume

    volume_step_names.sort()
    volume_name_parameters.sort()

    loaddata_task = loaddata_op()\
        .add_pvolumes(pvolumes_dict)\
        .after()
    loaddata_task.container.working_dir = "/kale"
    loaddata_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'loaddata': '/loaddata.html'})
    loaddata_task.output_artifact_paths.update(output_artifacts)
    loaddata_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = loaddata_task.dependent_names + volume_step_names
    loaddata_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        loaddata_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    datapreprocessing_task = datapreprocessing_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(loaddata_task)
    datapreprocessing_task.container.working_dir = "/kale"
    datapreprocessing_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'datapreprocessing': '/datapreprocessing.html'})
    datapreprocessing_task.output_artifact_paths.update(output_artifacts)
    datapreprocessing_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = datapreprocessing_task.dependent_names + volume_step_names
    datapreprocessing_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        datapreprocessing_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    featureengineering_task = featureengineering_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(datapreprocessing_task)
    featureengineering_task.container.working_dir = "/kale"
    featureengineering_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'featureengineering': '/featureengineering.html'})
    featureengineering_task.output_artifact_paths.update(output_artifacts)
    featureengineering_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = featureengineering_task.dependent_names + volume_step_names
    featureengineering_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        featureengineering_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    decisiontree_task = decisiontree_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(featureengineering_task)
    decisiontree_task.container.working_dir = "/kale"
    decisiontree_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'decisiontree': '/decisiontree.html'})
    decisiontree_task.output_artifact_paths.update(output_artifacts)
    decisiontree_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = decisiontree_task.dependent_names + volume_step_names
    decisiontree_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        decisiontree_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    svm_task = svm_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(featureengineering_task)
    svm_task.container.working_dir = "/kale"
    svm_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'svm': '/svm.html'})
    svm_task.output_artifact_paths.update(output_artifacts)
    svm_task.add_pod_label("pipelines.kubeflow.org/metadata_written", "true")
    dep_names = svm_task.dependent_names + volume_step_names
    svm_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        svm_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    naivebayes_task = naivebayes_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(featureengineering_task)
    naivebayes_task.container.working_dir = "/kale"
    naivebayes_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'naivebayes': '/naivebayes.html'})
    naivebayes_task.output_artifact_paths.update(output_artifacts)
    naivebayes_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = naivebayes_task.dependent_names + volume_step_names
    naivebayes_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        naivebayes_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    logisticregression_task = logisticregression_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(featureengineering_task)
    logisticregression_task.container.working_dir = "/kale"
    logisticregression_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'logisticregression': '/logisticregression.html'})
    logisticregression_task.output_artifact_paths.update(output_artifacts)
    logisticregression_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = logisticregression_task.dependent_names + volume_step_names
    logisticregression_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        logisticregression_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    randomforest_task = randomforest_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(featureengineering_task)
    randomforest_task.container.working_dir = "/kale"
    randomforest_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'randomforest': '/randomforest.html'})
    randomforest_task.output_artifact_paths.update(output_artifacts)
    randomforest_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = randomforest_task.dependent_names + volume_step_names
    randomforest_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        randomforest_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    results_task = results_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(randomforest_task, logisticregression_task, naivebayes_task, svm_task, decisiontree_task)
    results_task.container.working_dir = "/kale"
    results_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'results': '/results.html'})
    results_task.output_artifact_paths.update(output_artifacts)
    results_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = results_task.dependent_names + volume_step_names
    results_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        results_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))


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
    from kale.common.kfputils import generate_run_name
    run_name = generate_run_name('titanic-ml-rnd')
    run_result = client.run_pipeline(
        experiment.id, run_name, pipeline_filename, {})
