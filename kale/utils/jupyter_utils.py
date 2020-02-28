import nbformat

from jupyter_client.kernelspec import get_kernel_spec
from nbconvert.preprocessors.execute import ExecutePreprocessor


def run_code(source: tuple, kernel_name='python3'):
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

    # start preprocessor: run each code cell and capture the output
    ep.preprocess(notebook, resources, km=km)
