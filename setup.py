from setuptools import setup


# read the contents of your README file
from os import path
this_directory = path.abspath(path.dirname(__file__))
with open(path.join(this_directory, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='kfp-kale',
    version='0.1.2',
    description='Convert JupyterNotebooks to Kubeflow Pipelines deployments',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/StefanoFioravanzo/kale',
    author='Stefano Fioravanzo',
    author_email='fioravanzo@fbk.eu',
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
    include_package_data=True,
    zip_safe=False
)

