"""
This is a skeleton script that shows how you can build a Kubeflow pipeline
using the Kale SDK.
"""

"""
The only imports you need to convert your python code to a pipeline are these
two decorators.
"""
from kale.sdk import pipeline, step


"""
Defining a step is as simple as decorating a Python function. When a function
is decorated with `@step`, Kale will generate a KFP pipeline step executing
the decorated function.

Just make sure to `import` all your modules *inside* the function definition,
as the code that will run in the Kubeflow pipeline won't have the entire
context of the current script.

If you are using Rok to take snapshots (see below on how this works with the
Kale SDK) and reproduce the current environment in the pipeline step, you
can use relative imports to reference local scripts.
"""
@step(name="my_step")
def foo(a):
    # Using a relative import to another local script will work as long as
    # you are using rok to snapshot the current environment and mount a clone
    # of the volume in the pipeline step:
    # from .script import bar
    import sys
    sys.stdout.write(a)
    # return multiple values. These could be used by different subsequent
    # pipeline steps.
    return "Some", "Data"


@step(name="second_step")
def foo2(b, c):
    print(b + c)


@step(name="third_step")
def foo3(b, c):
    print(b + c)


"""
You are not restricted to defining all your functions in a single source file.
Organize your "step" functions as you like in other local scripts and import
then. Treat your functions just like any other Python project, Kale just needs
to access the function *objects*, not their original source code.

E.g.:

```
# import the `@step` decorated function `processing_step`, from file
# `data_processing.py`
from .data_processing import processing_step
```
"""

"""
Define the pipeline:

Once you have all your steps (i.e. functions) defined, all you need to do to
define and create the pipeline is to call all of these functions from a single
"entry-point", just like you would normally do for running your code locally.

Use the `pipeline` decorator to tell Kale that this is the function defining
the pipeline structure. Decide a pipeline name and an experiment. In Kubeflow
Pipelines, experiments are containers of runs. Ideally you should create a new
experiment for every new project.

Note that until now you have been writing *plain Python*. All the step
functions can be written as any other Python function, with no restrictions,
and you can even import them from other local files.

The `@pipeline` decorated function poses some syntax restrictions, as Kale
needs to parse it to create a corresponding pipeline representation. Whenever
these restrictions are not met, Kale will try to fail gracefully and inform you
how you should fix it. These are the notable constraints:

- You can add input arguments to define *pipeline parameters*. All input
  arguments expect a default value.
- The body of the function does not accept arbitrary Python statements. All
  you can write is function calls, chaining the together with their return
  arguments.
- Each line should contain a function call with its return value.
- Use tuple unpacking to return multiple values
"""
@pipeline(name="my-beautiful-pipeline",
          experiment="learning-the-kale-sdk")
def my_pipeline(parameter="input"):
    data1, data2 = foo(parameter)
    foo2(data1, parameter)
    foo3(data2, parameter)


"""
Add a script entry-point to call the function from CLI.

You can override the default pipeline parameters when calling the pipeline,
just remember that only keyword argument are accepted when calling a
`@pipeline` decorated function.

Once you write the entry-point, you can either run the pipeline locally, or
compile and run the pipeline in Kubeflow.

## Local run:

```
python3 skeleton.py
```

That's it. Running the script itself will invoke the `@pipeline` decorated
functions. At this point Kale will validate your code and make sure that it can
be converted into a pipeline. Then, Kale will start a local execution, so that
you can uncover bugs early, before actually submitting the run to Kubeflow.

This is a great way to quickly debug what is going on in your code and speed up
the development process.

## Compile and run in Kubeflow

Compiling the pipeline and running it in Kubeflow Pipelines is extremely easy:

```
python3 skeleton.py --kfp
```

When running the above command, the following things will happen:

- Kale validates the current code, to make sure that it can be converted to a
  pipeline
- Rok takes a snapshot of your mounted volumes
- Kale creates a new KFP pipelines, using the same docker image as your current
  environment as base image for the step and seeding clones of your volumes.
- Kale creates (if necessary) a new KFP experiment, based on the provided name
- Kale uploads a new pipeline definition
- Kale starts a new pipeline run
"""
if __name__ == "__main__":
    my_pipeline(parameter="test")
