# Copyright 2021-2022 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""The CoronaHack dataset challenge.

This script launches a Kubeflow pipeline that creates a PyTorch distributed
training process, leveraging Kale's integration with the PyTorch operator.

This process fine-tunes a PyTorch model on the CoronaHack Chest X-Ray dataset.
The objective is to classify a chest x-ray image as healthy or not. A chest
X-ray image that is not healthy presents signs of pneumonia.
"""

import os
import time
import logging

import torch
import pandas as pd
import torchmetrics
import torch.nn as nn
import torch.optim as optim
import torchvision.models as models
import torchvision.transforms as transforms

from typing import Optional, Tuple
from PIL import Image
from pathlib import Path
from kubernetes.client.rest import ApiException
from torch.utils.data import Dataset, DataLoader

from kale.sdk import step, pipeline
from kale.distributed import pytorch


logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

PATH = Path(os.path.dirname(os.path.abspath(__file__)))
DATA = PATH/"data"
XRAY_DIR = DATA/"Coronahack-Chest-XRay-Dataset/Coronahack-Chest-XRay-Dataset/"
METADATA_PATH = DATA/"Chest_xray_Corona_Metadata.csv"


def train_step(model: 'torch.nn.Module',
               data_loader: 'torch.utils.data.DataLoader',
               criterion: 'torch.nn.modules.loss._Loss',
               optimizer: 'torch.optim.Optimizer',
               device: 'torch.device',
               args: dict):
    """Defines what happens during a training step.

    Kale will call this function once per epoch. You can control what happens
    during a training step by defining your own loop and passing custom
    arguments using the ``args`` dictionary.

    The ``train_step`` must have exactly this signature and it should be a
    standalone function. This means that you should import all the Python
    modules the function depends on within its body and pass any extra
    arguments inside the args dictionary.

    Args:
        model (torch.nn.Module): The model to train.
        data_loader (torch.utils.data.DataLoader): The data loader to use.
        criterion (torch.nn.modules.loss._Loss): The loss function to use.
        optimizer (torch.optim.Optimizer): The optimizer to use.
        device (torch.device): The device to use.
        args (dict): A dictionary of arguments.
    """
    import logging

    log = logging.getLogger(__name__)

    metric = args.get("metric", None)
    if metric:
        metric.to(device)

    for i, (features, labels) in enumerate(data_loader):
        features = features.to(device)
        labels = labels.to(device)

        pred = model(features)
        loss = criterion(pred, labels)

        if metric:
            acc = metric(pred, labels)

        loss.backward()

        optimizer.step()
        optimizer.zero_grad()

        if i % args.get("log_interval", 2) == 0:
            log.info(f"Loss = {loss.item()}")

    if metric:
        acc = metric.compute()
        log.info(f"Accuracy = {acc.item()}")


def eval_step(model: 'torch.nn.Module',
              data_loader: 'torch.utils.data.DataLoader',
              criterion: 'torch.nn.modules.loss._Loss',
              device: 'torch.device',
              args: dict):
    """Defines what happens during an evaluation step.

    Kale will call this function at the end of each epoch. You can control what
    happens during the evaluation step by defining your own loop and passing
    custom arguments using the ``args`` dictionary.

    The ``eval_step`` must have exactly this signature and it should be a
    standalone function. This means that you should import all the Python
    modules the function depends on within its body and pass any extra
    arguments inside the args dictionary.

    Args:
        model (torch.nn.Module): The model to train.
        data_loader (torch.utils.data.DataLoader): The data loader to use.
        criterion (torch.nn.modules.loss._Loss): The loss function to use.
        device (torch.device): The device to use.
        args (dict): A dictionary of arguments.
    """
    import logging

    log = logging.getLogger(__name__)

    metric = args.get("metric", None)
    if metric:
        metric.to(device)

    for _, (features, labels) in enumerate(data_loader):
        features = features.to(device)
        labels = labels.to(device)

        pred = model(features)
        loss = criterion(pred, labels)

        if metric:
            acc = metric(pred, labels)

    log.info(f"Loss = {loss.item()}")

    if metric:
        acc = metric.compute()
        log.info(f"Accuracy = {acc.item()}")


class CoronaHackDataset(Dataset):
    """Creates a CoronaHack dataset.

    This class creates tuples of images and labels and returns them as
    examples.

    Attributes:
        df (pd.DataFrame): The dataframe containing the metadata.
        data_path (str): Absolute path to the data directory
        tfms (transforms.Compose): The transforms to apply to the images.
        split (str): The split to use.
    """
    def __init__(self, df: 'pd.DataFrame',
                 data_path: str,
                 tfms: Optional['transforms.Compose'] = None,
                 split: Optional[str] = "train"):
        self.df = df
        self.data_path = data_path
        self.tfms = tfms
        self.file_names = self.df["X_ray_image_name"].values
        self.labels = self.df["Target"].values
        self.split = split

    def __len__(self):
        return len(self.df)

    def __getitem__(self, i):
        # construct the file path
        file_name = self.file_names[i]
        if self.split == "train":
            file_path = f"{self.data_path}/train/{file_name}"
        else:
            file_path = f"{self.data_path}/test/{file_name}"

        # augment the image
        image = Image.open(file_path)
        if self.tfms:
            augmented = self.tfms(image)
            image = augmented

        # retrieve the label for the image
        label = torch.tensor(self.labels[i]).long()

        # return the example
        return image, label


def create_data_loaders(train_df: 'pd.DataFrame',
                        valid_df: 'pd.DataFrame',
                        data_path: str) -> Tuple:
    """Create the train and valid DataLoaders.

    Args:
        train_df (pd.DataFrame): The training dataframe.
        valid_df (pd.DataFrame): The validation dataframe.
        data_path (str): Absolute path to the data directory

    Returns:
        train_loader (torch.utils.data.DataLoader): The training data loader.
        valid_loader (torch.utils.data.DataLoader): The validation data loader.
    """
    _tfms = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.Grayscale(num_output_channels=1),
        transforms.ToTensor(),
        transforms.Normalize((0.1307), (0.3081))
    ])

    train_dataset = CoronaHackDataset(train_df, data_path, _tfms)
    test_dataset = CoronaHackDataset(valid_df, data_path, _tfms, split="test")

    train_loader = DataLoader(train_dataset, batch_size=512, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=1024, pin_memory=True)

    return train_loader, test_loader


@step(name="load_dataset")
def load_data() -> Tuple:
    """Load the dataset.

    This function defines the first step in the pipeline. It loads the dataset
    and returns the dataframes containing the training and validation data.

    Returns:
        train_df (pd.DataFrame): The training dataframe.
        valid_df (pd.DataFrame): The validation dataframe.
    """
    df = pd.read_csv(METADATA_PATH)
    df["Target"] = df["Label"].astype("category").cat.codes

    train_df = df[df["Dataset_type"] == "TRAIN"]
    test_df = df[df["Dataset_type"] == "TEST"]

    return train_df, test_df


@step(name="define_model")
def create_model() -> Tuple:
    """Define the model.

    This is the second step in the pipeline. It defines the model and returns
    it. The model is a pretrained ResNet-18 model with the last layer removed.
    This is a common architecture used for image classification.

    It also constructs and returns the loss function and the optimizer.

    Returns:
        model (torch.nn.Module): The model to train.
    """
    model = models.resnet18(pretrained=True)
    model.conv1 = nn.Conv2d(1, 64, kernel_size=(7, 7),
                            stride=(2, 2), padding=(3, 3), bias=False)

    for param in model.parameters():
        param.requires_grad = False

    features_in = model.fc.in_features
    model.fc = nn.Linear(features_in, 2)

    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()

    return model, optimizer, criterion


@step(name="submit_training_job")
def distribute_training(model: 'torch.nn.Module',
                        criterion: 'torch.nn.modules.loss._Loss',
                        optimizer: 'torch.optim.Optimizer',
                        train_df: 'pd.DataFrame',
                        valid_df: 'pd.DataFrame') -> str:
    """Train the model.

    This is the third step in the pipeline. It submits a ``PyTorchJob`` CR and
    returns the name of the job.

    Args:
        model (torch.nn.Module): The model to train.
        train_df (pd.DataFrame): The training dataframe.
        criterion (torch.nn.modules.loss._Loss): The loss function to use.
        optimizer (torch.optim.Optimizer): The optimizer to use.
        valid_df (pd.DataFrame): The validation dataframe.

    Returns:
        job_name (str): The name of the PyTochJob CR.
    """
    train_loader, valid_loader = create_data_loaders(train_df, valid_df,
                                                     str(XRAY_DIR))

    # Set args
    metric = torchmetrics.Accuracy()
    train_args = {"log_interval": 2, "metric": metric}
    eval_args = {"metric": metric}

    job = pytorch.distribute(model,
                             train_loader,
                             criterion,
                             optimizer,
                             train_step,
                             eval_data_loader=valid_loader,
                             eval_step=eval_step,
                             cuda=False,
                             epochs=10,
                             number_of_processes=3,
                             train_args=train_args,
                             eval_args=eval_args)
    return job.name


@step(name="monitor")
def monitor(name: str):
    """Monitor the PyTorchJob CR.

    This is the fourth step in the pipeline. It monitors the PyTorchJob CR and
    streams the logs of the pod running the master process.

    Args:
        name (str): The name of the PyTorchJob CR.
    """
    log.info(f"Monitoring PyTorchJob: {name}")
    job = pytorch.PyTorchJob(name)
    while True:  # Iterate if streaming logs raises an ApiException
        while True:
            cr = job.get()
            if (job.get_job_status() not in ["", "Created", "Restarting"]
                    and (cr.get("status", {})
                           .get("replicaStatuses", {})
                           .get("Master", {}))):
                break
            log.info("Job pending...")
            time.sleep(2)
        try:
            job.stream_logs()
            break
        except ApiException as e:
            log.warning("Streaming the logs failed with: %s", str(e))
            log.warning("Retrying...")


# @step(name="delete")
# def delete(name: str):
#     """Delete the PyTorchJob CR.

#     This is the fifth step in the pipeline. It deletes the PyTorchJob CR if
#     it enters the Succeeded or Failed state.

#     Args:
#         name (str): The name of the PyTorchJob CR.
#     """
#     log.info(f"Deleting PyTorchJob: {name}")
#     job = pytorch.PyTorchJob(name)
#     while job.get_job_status() not in ["Succeeded", "Failed"]:
#         time.sleep(4)
#     job.delete()


@pipeline(name="coronahack", experiment="kale-distributed")
def ml_pipeline():
    """Run the ML pipeline."""
    train_df, test_df = load_data()
    model, optimizer, criterion = create_model()
    job_name = distribute_training(model, criterion, optimizer,
                                   train_df, test_df)
    monitor(job_name)
    # delete(job_name)


if __name__ == "__main__":
    ml_pipeline()
