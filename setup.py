from setuptools import setup


# read the contents of README file
from os import path
this_directory = path.abspath(path.dirname(__file__))
with open(path.join(this_directory, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='kubeflow-kale',
    version='0.3.1',
    description='Convert JupyterNotebooks to Kubeflow Pipelines deployments',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/kubeflow-kale/kale',
    author='Stefano Fioravanzo',
    author_email='stefano.fioravanzo@gmail.com',
    license='MIT',
    packages=['kale',
              'kale.nbparser',
              'kale.static_analysis',
              'kale.marshal',
              'kale.codegen',
              'kale.api'
              ],
    install_requires=[
        'kfp',
        'autopep8',
        'nbformat',
        'networkx',
        'jinja2',
        'graphviz',
        'pyflakes',
        'papermill',
        'flask_restful',
        'flask',
    ],
    entry_points={
        'console_scripts': ['kale=kale.command_line:main', 'kale_server=kale.command_line:server'],
    },
    python_requires='>=3.6.0',
    include_package_data=True,
    zip_safe=False
)

