#  Copyright 2020 The Kale Authors
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

import os
import sys
import json
import time
import signal
import nbformat
import threading

from queue import Empty
from kale.utils import pod_utils
from jupyter_client.kernelspec import get_kernel_spec
from kale.utils.utils import remove_ansi_color_sequences
from nbconvert.preprocessors.execute import ExecutePreprocessor

from packaging import version as pkg_version

html_template = '''
<html><head>
    <style>
        table {
            border: none;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: 14px;
        }
        td,
        th {
            text-align: right;
            vertical-align: middle;
            padding: 0.5em 0.5em;
            line-height: 1.0;
            white-space: nowrap;
            max-width: 100px;
            text-overflow: ellipsis;
            overflow: hidden;
            border: none;
        }
        th {
            font-weight: bold;
        }
        tbody tr:nth-child(odd) {
            background: rgb(245, 245, 245);
        }
    </style>
</head>
<body><div>
%s
</div></body>
</html>
'''

image_html_template = '''
<div>
  <p>{}</p>
  <img src="data:image/png;base64, {}" />
</div>
'''

text_html_template = '''
<pre>
------- CELL OUTPUT -------
{}
---------------------------
</pre>
<br><br>
'''

javascript_html_template = '''
<script>
{}
</script>
'''


class KaleKernelException(Exception):
    """Raised when signal_handler receives a signal from capture_streams."""
    pass


def generate_html_output(outputs):
    """Transform a notebook cell rich outputs into a html page.

    Args:
        outputs: notebook cell output

    Returns: html multiline string
    """
    if not isinstance(outputs, list):
        raise ValueError("A notebook's cell outputs must be a valid list."
                         " Found {} instead.".format(type(outputs)))
    html_body = ""
    # run through the list of outputs
    for o in outputs:
        # the only rich outputs should come from `display_data` and
        # `execution_result` messages. The latter are identical to
        # `display_data` messages, with the addition of an execution_count key.
        output_type = o.get('output_type', None)
        if not output_type:
            raise ValueError("Cell output dict has not `output_type` field."
                             " Output: {}".format(o))
        if o['output_type'] in ['display_data', 'execute_result']:
            # check mime-type of content
            # Currently supported MIME types:
            # see: https://ipython.org/ipython-doc/2/api/generated/IPython.core.displaypub.html#IPython.core.displaypub.DisplayPublisher
            # text / plain
            # text / html
            # text / markdown
            # text / latex
            # application / json
            # application / javascript
            # image / png
            # image / jpeg
            # image / svg + xml
            data = o['data']
            # TODO: Generalize to multiple image types (i.e. jpeg and svg+xml)
            if 'image/png' in data:
                title = data.get('text/plain', '')
                html = image_html_template.format(title, data['image/png'])
                html_body += html

            if 'text/html' in data:
                html_body += data['text/html']

            if ('image/png' not in data
                    and 'text/html' not in data
                    and 'text/plain' in data):
                html_body += text_html_template.format(data['text/plain'])

            if 'application/javascript' in data:
                html_body += javascript_html_template.format(
                    data['application/javascript'])
    return html_body


def update_uimetadata(artifact_name,
                      uimetadata_path='/mlpipeline-ui-metadata.json'):
    """Update ui-metadata dictionary with a new web-app entry.

    Args:
        artifact_name: Name of the artifact
        uimetadata_path: path to mlpipeline-ui-metadata.json
    """
    # Default empty ui-metadata dict
    outputs = {"outputs": []}
    if os.path.exists(uimetadata_path):
        try:
            outputs = json.loads(
                open(uimetadata_path, 'r').read())
            if not outputs.get('outputs', None):
                outputs['outputs'] = []
        except json.JSONDecodeError as e:
            print("Failed to parse json file {}: {}\n"
                  "This step will not be able to visualize artifacts in the"
                  " KFP UI".format(uimetadata_path, e))

    pod_name = pod_utils.get_pod_name()
    namespace = pod_utils.get_namespace()
    workflow_name = pod_utils.get_workflow_name(pod_name, namespace)
    html_artifact_entry = [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/{}/{}/{}'.format(
            workflow_name, pod_name, artifact_name + '.tgz')
    }]
    outputs['outputs'] += html_artifact_entry
    with open(uimetadata_path, "w") as f:
        json.dump(outputs, f)


def process_outputs(cells):
    """Process a list of cells outputs after execution."""
    html_outputs = [generate_html_output(c.outputs)
                    for c in cells]
    html_outputs = '\n'.join(html_outputs).strip()
    if html_outputs == "":
        html_outputs = "This step did not produce any artifacts."
    html_artifact = html_template % html_outputs
    return html_artifact


def capture_streams(kc, exit_on_error=False):
    """Capture stream and error outputs from a kernel connection.

    Get messages from the iopub channel of the `kc` kernel connection
    and write to stdout or stderr any message of type `stream`.
    Capture and exit when receiving an `error` message or when the message
    queue is done.

    Args:
        kc: kernel connection
        exit_on_error (bool): True to call sys.exit() when the kernel sends
            an error message.
    """
    while True:
        try:
            msg = kc.iopub_channel.get_msg()
        except Empty:
            print("The Kale kernel stream watcher thread raised an Empty"
                  " exception, exiting...")
            return

        msg_type = msg['header']['msg_type']
        content = msg['content']
        if msg_type == 'stream':  # stdout or stderr
            if content['name'] == 'stdout':
                sys.stdout.write(content['text'])
            elif content['name'] == 'stderr':
                sys.stderr.write(content['text'])
            else:
                raise NotImplementedError("stream message content name not"
                                          " recognized: {}"
                                          .format(content['name']))
        if msg_type == 'error':  # error and exceptions
            # traceback is a list of strings (jupyter protocol spec)
            traceback = map(remove_ansi_color_sequences,
                            content['traceback'])
            sys.stderr.write('\n'.join(traceback) + '\n')
            if exit_on_error:
                # when receiving an error from the kernel, we don't want
                # to just print the exception to stderr, otherwise the
                # pipeline step would complete successfully.
                # kill sends the signal to the specific pid (main thread)
                os.kill(os.getpid(), signal.SIGUSR1)


def run_code(source: tuple, kernel_name='python3'):
    """Run code blocks inside a jupyter kernel.

    Args:
        source (tuple): source code blocks
        kernel_name: name of the kernel (form the kernel spec) to be created
    """
    import IPython
    if pkg_version.parse(IPython.__version__) < pkg_version.parse('7.6.0'):
        raise RuntimeError("IPython version {} not supported."
                           " Kale requires at least version 7.6.0."
                           .format(IPython.__version__))

    # new notebook
    spec = get_kernel_spec(kernel_name)
    notebook = nbformat.v4.new_notebook(metadata={
        'kernelspec': {
            'display_name': spec.display_name,
            'language': spec.language,
            'name': kernel_name,
        }})
    notebook.cells = [nbformat.v4.new_code_cell(s) for s in source]
    # these parameters are passed to nbconvert.ExecutePreprocessor
    jupyter_execute_kwargs = dict(
        timeout=-1, allow_errors=True, store_widget_state=True)

    resources = {}
    # cwd: If supplied, the kernel will run in this directory
    # resources['metadata'] = {'path': cwd}
    ep = ExecutePreprocessor(**jupyter_execute_kwargs)
    km = ep.kernel_manager_class(kernel_name=kernel_name, config=ep.config)
    # start_kernel supports several additional arguments via **kw
    km.start_kernel(extra_arguments=ep.extra_arguments)
    kc = km.client()
    kc.start_channels()
    try:
        kc.wait_for_ready(timeout=60)
    except RuntimeError:
        kc.stop_channels()
        raise
    kc.allow_stdin = False

    def signal_handler(_signal, _frame):
        raise KaleKernelException()

    # this signal is used by the thread in case an error message is received
    # by the kernel. Running sys.exit() inside the thread would terminate
    # just the thread itself, not the main process. Calling os._exit() can be
    # dangerous as the process is killed instantly (files and connections are
    # not closed, for example). With a signal we can capture the ExitCommand
    # exception from the main process and exit gracefully.
    signal.signal(signal.SIGUSR1, signal_handler)
    # start separate thread in to capture and print stdout, stderr, errors.
    # daemon mode will make the watcher thread die when the main one returns.
    x = threading.Thread(target=capture_streams, args=(kc, True,), daemon=True)
    x.start()

    try:
        # start preprocessor: run each code cell and capture the output
        ep.preprocess(notebook, resources, km=km)
    except KaleKernelException:
        # exit gracefully with error
        sys.exit(-1)
    # Give some time to the stream watcher thread to receive all messages from
    # the kernel before shutting down.
    time.sleep(1)
    km.shutdown_kernel()

    result = process_outputs(notebook.cells)
    return result
