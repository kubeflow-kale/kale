## Azure deployment

After creating the K8S Service in Azure, configure local `kubectl` with:

```bash
az aks get-credentials --name ${CLUSTER_NAME} --resource-group ${RESOURCE_GROUP}
```

To get cluster details:

```bash
az aks show --name ${CLUSTER_NAME} --resource-group ${RESOURCE_GROUP} --output table
```

Use now `kubectl` to get the cluster details.

To access the Kubernetes dashboard:

```bash
az aks browse --resource-group ${RESOURCE_GROUP} --name ${CLUSTER_NAME}
```

In case the dashboard shows access errors, run the following to grant access:

```bash
kubectl create clusterrolebinding kubernetes-dashboard --clusterrole=cluster-admin --serviceaccount=kube-system:kubernetes-dashboard
```

Currently:

```bash
export CLUSTER_NAME=KubeflowPipelines
export RESOURCE_GROUP=Kubernetes-Cluster-EU
```

---

## Kubeflow Deployment

To install Kubeflow on a running kubernetes cluster:

```bash
export KUBEFLOW_SRC=/path/to/folder/kubeflow  # Set this to whatever location
export KUBEFLOW_TAG=v0.4.1
export KFAPP=pipelines

mkdir ${KUBEFLOW_SRC}
cd ${KUBEFLOW_SRC}

curl https://raw.githubusercontent.com/kubeflow/kubeflow/${KUBEFLOW_TAG}/scripts/download.sh | bash

${KUBEFLOW_SRC}/scripts/kfctl.sh init ${KFAPP} --platform none
cd ${KFAPP}
${KUBEFLOW_SRC}/scripts/kfctl.sh generate k8s
${KUBEFLOW_SRC}/scripts/kfctl.sh apply k8s
```

After that run `kubectl get all --namespace=kubeflow` to monitor the newly created resources and `kubectl config set-context $(kubectl config current-context) --namespace=kubeflow` to switch to the Kubeflow namespace permanently.

#### Kubeflow dashboard

```
kubectl port-forward svc/ambassador -n kubeflow 8080:80
```

#### KFP Notebook

If you want to run kfp code inside a kfp notebook, first install (upgrade) the kfp sdk

```
!pip3 install 'https://storage.googleapis.com/ml-pipeline/release/0.1.4/kfp.tar.gz'
```


#### Create the FileShare, PV and PVC


Create storage account on Azure and get the credentials to create the Kube secret

```bash
az storage account list --output table  # list available storage accounts
az storage account create --resource-group ${RESOURCE_GROUP} --name ${STORAGE_ACCOUNT_NAME} --location eastus --sku Standard_LRS
# set connection string to account storage - used to create file share and interact with account storage.
export AZURE_STORAGE_CONNECTION_STRING=$(az storage account show-connection-string --name ${STORAGE_ACCOUNT_NAME} --resource-group ${RESOURCE_GROUP} -o tsv)
export AZURE_STORAGE_ACCOUNT_NAME_BASE64=$(echo -n ${STORAGE_ACCOUNT_NAME} | base64)
export AZURE_STORAGE_ACCOUNT_KEY_BASE64=$(az storage account keys list --account-name ${STORAGE_ACCOUNT_NAME} --resource-group ${RESOURCE_GROUP} -o tsv  | head -n 1 | awk '{print $3}' | tr -d '\n' | base64)
```

**NOTE:** Use these (base64) account name and account key in the `secret.yml` file.

Create the FileShare from the Azure portal.

Create the storage class, pv, secret and pvc using kubectl. The pvc is used by the generated pipeline steps to share data between them

```bash
kubectl create -f path/to/storage_class.yml  # (reference storage account name)
kubectl create -f pv.yml
kubectl create -f secret.yml
kubectl create -f pvc.yml
```



