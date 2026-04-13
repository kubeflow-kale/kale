Compiler
========

The ``kale.compiler`` module turns a :class:`~kale.pipeline.Pipeline` into a
Kubeflow Pipelines v2 DSL script. It renders the Jinja2 templates in
``kale/templates/``, applies code formatting, and optionally hands off to
the KFP SDK for compilation and submission.

.. automodule:: kale.compiler
   :members:
   :exclude-members: Environment, FileSystemLoader, PackageLoader
   :show-inheritance:
