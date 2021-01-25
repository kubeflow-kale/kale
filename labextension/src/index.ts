import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the kubeflow-kale-labextension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'kubeflow-kale-labextension',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension kubeflow-kale-labextension is activated!');
  }
};

export default extension;
