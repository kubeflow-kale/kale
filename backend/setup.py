from setuptools import setup


def readme():
    with open('README.md') as f:
        return f.read()


setup(
    name='kfp-kale',
    version='0.1',
    description='Convert JupyterNotebooks to Kubeflow Pipelines deployments',
    longdescription=readme(),
    url='https://github.com/StefanoFioravanzo/kale',
    author='Stefano Fioravanzo',
    author_email='fioravanzo@fbk.eu',
    license='MIT',
    packages=['kale', 'kale.nbparser', 'kale.static_analysis', 'kale.marshal', 'kale.codegen'],
    install_requires=[
        'kfp',
        'autopep8',
        'nbformat',
        'networkx',
        'jinja2',
        'graphviz',
        'pyflakes',
        'papermill',
        'flask',
        'flask_restful'
    ],
    entry_points={
        'console_scripts': ['kale=kale.command_line:main'],
    },
    include_package_data=True,
    zip_safe=False
)

