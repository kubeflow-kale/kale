from setuptools import setup, find_packages

setup(
    name='kubeflow-kale',
    version="0.7.1",
    description='Convert JupyterNotebooks to Kubeflow Pipelines deployments',
    url='https://github.com/kubeflow-kale/kale',
    author='Stefano Fioravanzo',
    author_email='stefano.fioravanzo@gmail.com',
    license='Apache License Version 2.0',
    packages=["kale",
              'kale.common',
              'kale.config',
              'kale.marshal',
              'kale.processors',
              'kale.rpc',
              'kale.kfserving',
              'kale.sdk'
            ],
    package_dir={"kale": "backend/kale"},
    include_package_data=True,
    python_requires='>=3.6',    
)