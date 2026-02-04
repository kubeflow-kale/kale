# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
This file showcases how you can run pipelines that call external utilities
or software. Python becomes the orchestrator of your pipeline and the
entry point to any CLI tool installed in your environment.

In order to run external commands from Python, you can user the `cmdutils`
module in the `rok_common` package.

Running a command is as simple as:

```
> from rok_common.cmdutils import run
> run("ls -la")
```

`run` will wait for the command to complete its execution, before retuning the
result. Once the command is done, `run` returns and object of type
`ExtCommand` that can be used to inspect what happened.

Some useful properties of `ExtCommand`:

- `out`: the stdout stream produced by the command
- `err`: the stderr stream produced by the command
- `pid`: the PID of the process created by the command
- `returncode`: the return code of the process

In case the command fails, `run` will raise a `CommandExecutionError`
exception.

Note: if you want to read the `out` and `err` properties for analysis, after
the command has finished running, do the following:

```
> from rok_common.cmdutils import run, STORE
> ext = run("ls -la", stdout=STORE, stderr=STORE)
> print(ext.out)
> print(ext.err)
```

If you want to read more about the various arguments of `run` and how you can
customize the execution:

```
> from rok_common.cmdutils import run, ExtCommand
> help(run)
> help(ExtCommand)  # Read docstrings form the class definition and `__init__`
```

or, if you are inside a Jupyter Notebook, use the Jupyter helper `?` to print
the docstrings nicely:

```
[cell1]> from rok_common.cmdutils import run, ExtCommand
[cell2]> run?
[cell3]> ExtCommand?
```

"""

from kale.sdk import pipeline, step


@step(name="download")
def download(src_bucket):
    import os
    from rok_common.cmdutils import run, STORE

    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cmd = ("gcloud auth activate-service-account "
           "--key-file %s" % path)
    run(cmd)

    # download data
    cmd = "gsutil cp -R %s ./images" % src_bucket
    # will raise an exception with error message in case
    # of failure.
    cmd = run(cmd, stdout=STORE, stderr=STORE)
    return "./images"


@step(name="compression")
def compress(data_path):
    from rok_common.cmdutils import run, STORE
    cmd = "tar -czvf images.tar.gz %s" % data_path
    try:
        run(cmd)
    except Exception as e:
        print("Compression command failed")
        print(e)
        return "Error"
    return "images.tar.gz"


@step(name="upload")
def upload(compress_res, destination_bucket):
    import os
    from rok_common.cmdutils import run, STORE

    if compress_res == "Error":
        # Perform some clean up
        run("rm -rf images")
        return

    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cmd = ("gcloud auth activate-service-account "
           "--key-file %s" % path)
    run(cmd)

    cmd = "gsutil cp -R %s %s" % (compress_res, destination_bucket)
    cmd = run(cmd, stdout=STORE, stderr=STORE)


@pipeline(name="compression-pipeline",
          experiment="compression-pipeline",
          autosnapshot=False)
def compression_pipeline(source_bucket="gs://default/",
                         destination_bucket="gs://default/"):
    path = download(source_bucket)
    compress_res = compress(path)
    upload(compress_res, destination_bucket)


if __name__ == "__main__":
    compression_pipeline(
        source_bucket="gs://shell-demo/images",
        destination_bucket="gs://shell-demo")
