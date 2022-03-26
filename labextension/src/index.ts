import {
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

// export default plugin;
import kubeflowKalePlugin from './widget';
export default [kubeflowKalePlugin] as JupyterFrontEndPlugin<any>[];
