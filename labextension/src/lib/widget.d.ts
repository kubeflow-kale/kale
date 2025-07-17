/// <reference types="node" />
import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Token } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import '../style/index.css';
export declare const IKubeflowKale: Token<IKubeflowKale>;
export interface IKubeflowKale {
    widget: Widget;
}
declare const _default: JupyterFrontEndPlugin<IKubeflowKale>;
/**
 * Adds a visual Kubeflow Pipelines Deployment tool to the sidebar.
 */
export default _default;
