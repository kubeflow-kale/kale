import os
import sys
import signal
import nbformat
import threading

from queue import Empty
from jupyter_client.kernelspec import get_kernel_spec
from nbconvert.preprocessors.execute import ExecutePreprocessor


class KaleKernelException(Exception):
    """Raised when signal_handler receives a signal from capture_streams."""
    pass


def capture_streams(kc, exit_on_error=False, timeout=10):
    """Capture stream and error outputs from a kernel connection.

    Get messages from the iopub channel of the `kc` kernel connection
    and write to stdout or stderr any message of type `stream`.
    Capture and exit when receiving an `error` message or when the message
    queue is done.

    Args:
        kc: kernel connection
        exit_on_error (bool): True to call sys.exit() when the kernel sends
            an error message.
        timeout (int): number of seconds to wait before quitting the connection
    """
    while True:
        try:
            # this call will break the outer loop when more than `timeout`
            # seconds pass without a response.
            msg = kc.iopub_channel.get_msg(timeout=timeout)
            msg_type = msg['header']['msg_type']
            content = msg['content']
            if msg_type == 'stream':  # stdout or stderr
                if content['name'] == 'stdout':
                    sys.stdout.write(content['text'])
                elif content['name'] == 'stderr':
                    sys.stderr.write(content['text'])
                else:
                    raise NotImplementedError(
                        "stream message content name not recognized: %s"
                        % content['name'])
            if msg_type == 'error':  # error and exceptions
                sys.stderr.write('\n'.join(content['traceback']) + '\n')
                sys.stderr.write(
                    "%s: %s" % (content['ename'], content['evalue']))
                if exit_on_error:
                    # when receiving an error from the kernel, we don't want
                    # to just print the exception to stderr, otherwise the
                    # pipeline step would complete successfully.
                    # kill sends the signal to the specific pid (main thread)
                    os.kill(os.getpid(), signal.SIGUSR1)
        except Empty:
            return


def run_code(source: tuple, kernel_name='python3'):
    """Run code blocks inside a jupyter kernel.

    Args:
        source (tuple): source code blocks
        kernel_name: name of the kernel (form the kernel spec) to be created
    """
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
    # start separate thread to capture and print stdout, stderr, errors
    x = threading.Thread(target=capture_streams, args=(kc, True,))
    x.start()

    try:
        # start preprocessor: run each code cell and capture the output
        ep.preprocess(notebook, resources, km=km)
    except KaleKernelException:
        # exit gracefully with error
        sys.exit(-1)
