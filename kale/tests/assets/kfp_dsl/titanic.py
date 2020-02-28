import kfp.dsl as dsl
import kfp.components as comp
from collections import OrderedDict
from kubernetes import client as k8s_client


def loaddata():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
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
    path = "data/"

    PREDICTION_LABEL = 'Survived'

    test_df = pd.read_csv(path + "test.csv")
    train_df = pd.read_csv(path + "train.csv")
    '''

    data_saving_block = '''
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "PREDICTION_LABEL" in locals():
        _kale_resource_save(
            PREDICTION_LABEL, os.path.join(_kale_data_directory, "PREDICTION_LABEL"))
    else:
        print("_kale_resource_save: `PREDICTION_LABEL` not found.")
    if "test_df" in locals():
        _kale_resource_save(
            test_df, os.path.join(_kale_data_directory, "test_df"))
    else:
        print("_kale_resource_save: `test_df` not found.")
    if "train_df" in locals():
        _kale_resource_save(
            train_df, os.path.join(_kale_data_directory, "train_df"))
    else:
        print("_kale_resource_save: `train_df` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/loaddata.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('loaddata')


def datapreprocessing():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "test_df" not in _kale_directory_file_names:
        raise ValueError("test_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "test_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("test_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    test_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "train_df" not in _kale_directory_file_names:
        raise ValueError("train_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "test_df" in locals():
        _kale_resource_save(
            test_df, os.path.join(_kale_data_directory, "test_df"))
    else:
        print("_kale_resource_save: `test_df` not found.")
    if "train_df" in locals():
        _kale_resource_save(
            train_df, os.path.join(_kale_data_directory, "train_df"))
    else:
        print("_kale_resource_save: `train_df` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
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


def featureengineering():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "PREDICTION_LABEL" not in _kale_directory_file_names:
        raise ValueError("PREDICTION_LABEL" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "PREDICTION_LABEL")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("PREDICTION_LABEL", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    PREDICTION_LABEL = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "test_df" not in _kale_directory_file_names:
        raise ValueError("test_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "test_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("test_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    test_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "train_df" not in _kale_directory_file_names:
        raise ValueError("train_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
        dataset['Title'] = dataset.Name.str.extract(' ([A-Za-z]+)\.', expand=False)
        # replace titles with a more common title or as Rare
        dataset['Title'] = dataset['Title'].replace(['Lady', 'Countess','Capt', 'Col','Don', 'Dr',\
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
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "train_df" in locals():
        _kale_resource_save(
            train_df, os.path.join(_kale_data_directory, "train_df"))
    else:
        print("_kale_resource_save: `train_df` not found.")
    if "train_labels" in locals():
        _kale_resource_save(
            train_labels, os.path.join(_kale_data_directory, "train_labels"))
    else:
        print("_kale_resource_save: `train_labels` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
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


def decisiontree():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "train_df" not in _kale_directory_file_names:
        raise ValueError("train_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "train_labels" not in _kale_directory_file_names:
        raise ValueError("train_labels" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_labels")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_labels", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_labels = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "acc_decision_tree" in locals():
        _kale_resource_save(
            acc_decision_tree, os.path.join(_kale_data_directory, "acc_decision_tree"))
    else:
        print("_kale_resource_save: `acc_decision_tree` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/decisiontree.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('decisiontree')


def svm():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "train_df" not in _kale_directory_file_names:
        raise ValueError("train_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "train_labels" not in _kale_directory_file_names:
        raise ValueError("train_labels" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_labels")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_labels", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_labels = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "acc_linear_svc" in locals():
        _kale_resource_save(
            acc_linear_svc, os.path.join(_kale_data_directory, "acc_linear_svc"))
    else:
        print("_kale_resource_save: `acc_linear_svc` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/svm.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('svm')


def naivebayes():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "train_df" not in _kale_directory_file_names:
        raise ValueError("train_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "train_labels" not in _kale_directory_file_names:
        raise ValueError("train_labels" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_labels")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_labels", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_labels = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "acc_gaussian" in locals():
        _kale_resource_save(
            acc_gaussian, os.path.join(_kale_data_directory, "acc_gaussian"))
    else:
        print("_kale_resource_save: `acc_gaussian` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/naivebayes.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('naivebayes')


def logisticregression():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "train_df" not in _kale_directory_file_names:
        raise ValueError("train_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "train_labels" not in _kale_directory_file_names:
        raise ValueError("train_labels" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_labels")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_labels", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_labels = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "acc_log" in locals():
        _kale_resource_save(
            acc_log, os.path.join(_kale_data_directory, "acc_log"))
    else:
        print("_kale_resource_save: `acc_log` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/logisticregression.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('logisticregression')


def randomforest():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "train_df" not in _kale_directory_file_names:
        raise ValueError("train_df" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_df")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_df", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_df = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "train_labels" not in _kale_directory_file_names:
        raise ValueError("train_labels" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "train_labels")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("train_labels", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    train_labels = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "acc_random_forest" in locals():
        _kale_resource_save(
            acc_random_forest, os.path.join(_kale_data_directory, "acc_random_forest"))
    else:
        print("_kale_resource_save: `acc_random_forest` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/randomforest.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('randomforest')


def results():
    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "acc_decision_tree" not in _kale_directory_file_names:
        raise ValueError("acc_decision_tree" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "acc_decision_tree")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("acc_decision_tree", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    acc_decision_tree = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "acc_gaussian" not in _kale_directory_file_names:
        raise ValueError("acc_gaussian" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "acc_gaussian")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("acc_gaussian", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    acc_gaussian = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "acc_linear_svc" not in _kale_directory_file_names:
        raise ValueError("acc_linear_svc" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "acc_linear_svc")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("acc_linear_svc", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    acc_linear_svc = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "acc_log" not in _kale_directory_file_names:
        raise ValueError("acc_log" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "acc_log")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("acc_log", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    acc_log = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    if "acc_random_forest" not in _kale_directory_file_names:
        raise ValueError("acc_random_forest" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "acc_random_forest")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("acc_random_forest", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    acc_random_forest = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
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
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
              block1,
              block2,
              )
    html_artifact = _kale_run_code(blocks)
    with open("/results.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('results')


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

    marshal_vop = dsl.VolumeOp(
        name="kale_marshal_volume",
        resource_name="kale-marshal-pvc",
        modes=dsl.VOLUME_MODE_RWM,
        size="1Gi"
    )
    pvolumes_dict['/marshal'] = marshal_vop.volume

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


if __name__ == "__main__":
    pipeline_func = auto_generated_pipeline
    pipeline_filename = pipeline_func.__name__ + '.pipeline.tar.gz'
    import kfp.compiler as compiler
    compiler.Compiler().compile(pipeline_func, pipeline_filename)

    # Get or create an experiment and submit a pipeline run
    import kfp
    client = kfp.Client()
    experiment = client.create_experiment('Titanic')

    # Submit a pipeline run
    run_name = 'titanic-ml-rnd_run'
    run_result = client.run_pipeline(
        experiment.id, run_name, pipeline_filename, {})
