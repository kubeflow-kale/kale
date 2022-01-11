# CoronaHack Tutorial

Pneumonia is an infection that inflames the air sacs in one or both lungs.
Chest X-Rays are one of the most important medical imaging methods to diagnose
it on-time.

In this project, we use the [CoronaHack Chest X-Ray](https://www.kaggle.com/praveengovi/coronahack-chest-xraydataset)
dataset to train a PyTorch model to classify X-Ray images as healthy or not.

We will train the PyTorch model in a distributed manner, on Kubeflow,
leveraging Kale's integration with the PyTorch operator.
    
# Set Up & Run

1. Change your working directory to the example folder:

   ```
   $ cd kale/examples/coronahack-distributed-training
   ```

1. Install PyTorch and TorchVision:

   ```
   $ pip3 install --user torch==1.9.1+cu111 torchvision==0.10.1+cu111 -f https://download.pytorch.org/whl/torch_stable.html
   ```

1. Install the necessary dependencies:

   ```
   $ pip3 install --user -r requirements.txt
   ```

1. Produce a workflow YAML file that you can inspect:

   ```
   $ python3 -m kale coronahack.py --compile
   ```

1. Deploy and run your code as a KFP pipeline:

   ```
   $ python3 -m kale coronahack.py --kfp
   ```
   
# Download the full dataset

In the `data` directory, you will find a small sample of the CoronaHack dataset,
for easy experimentation and iteration. To download the full dataset, follow this
procedure:

1. Create a [Kaggle](https://www.kaggle.com/) account or sign in using an
   existing one.
2. Create a new API token: Click on your profile icon, and choose *account* from
   the menu options. Under the API settings click *Create New API Token*. This
   will download a `kaggle.json` file.
3. Create a new folder in your `home` directory, and name it `.kaggle`:

   ```
   $ mkdir .kaggle
   ```

4. Copy the `kaggle.json` file in the folder you created in the previous step.
   Ensure `kaggle.json` is in the location `~/.kaggle/kaggle.json` to use the
   API.
5. Run the following command to download the dataset inside the example's
   `data` directory (You installed the `kaggle` CLI already while installing the
   Python requirements):

   ```
   $ kaggle datasets download praveengovi/coronahack-chest-xraydataset
   ```

6. Unzip the dataset by running the following command:

   ```
   $ unzip coronahack-chest-xraydataset.zip
   ```

# Attribution

The author of the [CoronaHack Chest X-Ray](https://www.kaggle.com/praveengovi/coronahack-chest-xraydataset)
dataset is [Praveen Govi](https://www.kaggle.com/praveengovi). The author collected
the data from https://github.com/ieee8023/covid-chestxray-dataset and Chest X-Ray
Kaggle dataset.
