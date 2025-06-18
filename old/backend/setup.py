#  Copyright 2019-2020 The Kale Authors
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from setuptools import setup


setup(
    name='kubeflow-kale',
    version='0.7.0',
    description='Convert JupyterNotebooks to Kubeflow Pipelines deployments',
    url='https://github.com/kubeflow-kale/kale',
    author='Stefano Fioravanzo',
    author_email='stefano.fioravanzo@gmail.com',
    license='Apache License Version 2.0',
    packages=['kale',
              'kale.common',
              'kale.config',
              'kale.marshal',
              'kale.processors',
              'kale.rpc',
              'kale.kfserving',
              'kale.sdk',
              ],
    install_requires=[
        'kfp',
        'autopep8 >=1.4, <1.5',
        'astor >= 0.8.1',
        'networkx >=2.3, <3.0',
        'jinja2 >=2.10, <3.0',
        'pyflakes >=2.1.1',
        'dill >=0.3, <0.4',
        'IPython >= 7.6.0',
        'jupyter-client >=5.3.4, <7.0.0',
        'jupyter-core >= 4.6.0',
        'nbconvert >=5.6.1, <6.0.0',
        'nbformat >=4.4, <5.0.0',
        'ipykernel >= 5.1.4',
        'notebook >= 6.0.0',
        'packaging > 20',
        'ml_metadata >= 0.26.0, < 1',
        'progress >= 1.5',
        'kfserving >= 0.4.0, < 0.5.0',
        'kubernetes < 12.0.0',
    ],
    extras_require={
        'dev': [
            'pytest',
            'pytest-clarity',
            'testfixtures',
            'pytest-cov',
            'flake8',
            'flake8-docstrings'
        ]
    },
    entry_points={'console_scripts':
                  ['kale=kale.cli:main',
                   'kale_server=kale.cli:server',
                   'kale-volumes=kale.cli:kale_volumes']},
    python_requires='>=3.6.0',
    include_package_data=True,
    zip_safe=False
)
