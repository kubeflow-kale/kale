import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import kubeflowKalePlugin from './widget';
export default [kubeflowKalePlugin] as JupyterFrontEndPlugin<any>[];
