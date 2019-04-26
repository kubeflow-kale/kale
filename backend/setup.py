from setuptools import setup


def readme():
    with open('README.md') as f:
        return f.read()


setup(
    name='kale',
    version='0.1',
    description='Deploy JupyterNotebooks to KFP pipelines',
    longdescription=readme(),
    url='https://github.com/StefanoFioravanzo/pipelines_converter',
    author='Stefano Fioravanzo',
    author_email='fioravanzo@fbk.eu',
    license='MIT',
    packages=['kale', 'kale.nbparser', 'kale.static_analysis', 'kale.marshal', 'kale.codegen'],
    install_requires=[
        'autopep8',
        'nbformat',
        'networkx',
        'jinja2',
        'graphviz',
        'pyflakes',
        'papermill',
    ],
    dependency_links=['https://storage.googleapis.com/ml-pipeline/release/0.1.7/kfp.tar.gz'],
    entry_points={
        'console_scripts': ['kale=kale.command_line:main'],
    },
    include_package_data=True,
    zip_safe=False
)

