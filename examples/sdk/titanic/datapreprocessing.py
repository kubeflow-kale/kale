# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from kale.sdk import step


@step(name="dataprocessing")
def dataprocessing(train_df, test_df):
    import numpy as np

    data = [train_df, test_df]
    for dataset in data:
        dataset['relatives'] = dataset['SibSp'] + dataset['Parch']
        dataset.loc[dataset['relatives'] > 0, 'not_alone'] = 0
        dataset.loc[dataset['relatives'] == 0, 'not_alone'] = 1
        dataset['not_alone'] = dataset['not_alone'].astype(int)
    train_df['not_alone'].value_counts()

    # This does not contribute to a person survival probability
    train_df = train_df.drop(['PassengerId'], axis=1)

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

    train_df['Embarked'].describe()

    # fill with most common value
    common_value = 'S'
    data = [train_df, test_df]

    for dataset in data:
        dataset['Embarked'] = dataset['Embarked'].fillna(common_value)

    train_df.info()

    return train_df, test_df
