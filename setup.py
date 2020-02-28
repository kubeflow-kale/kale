from setuptools import setup


# read the contents of README file
from os import path
this_directory = path.abspath(path.dirname(__file__))
with open(path.join(this_directory, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='kubeflow-kale',
    version='0.4.0',
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
              'kale.utils',
              'kale.rpc'
              ],
    install_requires=[
        'kfp >= 0.2',
        'autopep8 >=1.4, <1.5',
        'nbformat >=4.4, <5.0',
        'networkx >=2.3, <3.0',
        'jinja2 >=2.10, <3.0',
        'graphviz >=0.13, <1.0',
        'pyflakes >=2.1.1',
        'dill >=0.3, <0.4',
        'IPython >= 7.6.0',
        'jupyter-client >= 5.3.4',
        'jupyter-core >= 4.6.0',
        'nbconvert >= 5.6.1',
        'ipykernel >= 5.1.4',
        'kfp-server-api == 0.1.18.3',
        'packaging > 20'
    ],
    extras_require={
        'dev': [
            'pytest',
            'pytest-clarity',
            'testfixtures',
            'pytest-cov'
        ]
    },
    entry_points={'console_scripts':
                  ['kale=kale.command_line:main',
                   'kale_server=kale.command_line:server',
                   'kale-volumes=kale.command_line:kale_volumes']},
    python_requires='>=3.6.0',
    include_package_data=True,
    zip_safe=False
)
