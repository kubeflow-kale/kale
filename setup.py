from setuptools import setup


def readme():
    with open('README.md') as f:
        return f.read()


setup(
    name='pipelines-converter',
    version='0.1',
    description='A deployment tool from vanilla JupyterNotebooks to KFP pipelines',
    longdescription=readme(),
    url='https://github.com/StefanoFioravanzo/pipelines_converter',
    author='Stefano Fioravanzo',
    author_email='fioravanzo@fbk.eu',
    license='MIT',
    packages=['converter'],
    install_requires=[
      'nbformat',
      'networkx',
      'jinja2',
      'graphviz',
      'pyflakes'
    ],
    dependency_links=['https://storage.googleapis.com/ml-pipeline/release/0.1.7/kfp.tar.gz'],
    entry_points={
        'console_scripts': ['kfp_deploy=converter.command_line:main'],
    },
    include_package_data=True,
    zip_safe=False
)

