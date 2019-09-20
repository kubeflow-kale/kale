FROM gcr.io/kubeflow-images-public/tensorflow-1.13.1-notebook-cpu:v0.5.0

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates bash-completion \
        tar python-pip python-setuptools build-essential python-dev less && \
    rm -rf /var/lib/apt/lists/*

ENV SHELL /bin/bash

RUN echo "set background=dark" >> /etc/vim/vimrc.local

# https://www.kubeflow.org/docs/pipelines/sdk/install-sdk/
RUN pip3 install https://storage.googleapis.com/ml-pipeline/release/0.1.19/kfp.tar.gz --upgrade


RUN pip3 install jupyterlab==1.1.1 kubeflow-kale==0.1
RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - && \
    apt install -y nodejs
RUN jupyter labextension install kubeflow-kale-launcher

RUN echo "jovyan ALL=(ALL:ALL) NOPASSWD:ALL" > /etc/sudoers.d/jovyan
USER jovyan

CMD ["sh", "-c", "jupyter lab --notebook-dir=/home/jovyan --ip=0.0.0.0 --no-browser --allow-root --port=8888 --LabApp.token='' --LabApp.password='' --LabApp.allow_origin='*' --LabApp.base_url=${NB_PREFIX}"]