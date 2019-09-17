///<reference path="../node_modules/@types/node/index.d.ts"/>

import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
    ILabShell,
    ILayoutRestorer
} from "@jupyterlab/application";

import {
    INotebookTracker
} from '@jupyterlab/notebook';

import {ReactWidget} from "@jupyterlab/apputils";

import {Token} from "@phosphor/coreutils";
import {Widget} from "@phosphor/widgets";
import * as React from "react";

import '../style/index.css';

import {KubeflowKaleLeftPanel} from './components/LeftPanelWidget'


/* tslint:disable */
export const IKubeflowKale = new Token<IKubeflowKale>(
    "kubeflow-kale:IKubeflowKale"
);

export interface IKubeflowKale {
    widget: Widget;
}

const id = "kubeflow-kale:deploymentPanel";
/**
 * Adds a visual Kubeflow Pipelines Deployment tool to the sidebar.
 */
export default {
    activate,
    id,
    requires: [ILabShell, ILayoutRestorer, INotebookTracker],
    provides: IKubeflowKale,
    autoStart: true
} as JupyterFrontEndPlugin<IKubeflowKale>;

function activate(
    lab: JupyterFrontEnd,
    labShell: ILabShell,
    restorer: ILayoutRestorer,
    tracker: INotebookTracker
): IKubeflowKale {
    const widget = ReactWidget.create(
        <KubeflowKaleLeftPanel
            tracker={tracker}
        />
    );
    widget.id = "kubeflow-kale/kubeflowDeployment";
    widget.title.iconClass = "jp-kubeflow-logo jp-SideBar-tabIcon";
    widget.title.caption = "Kubeflow Pipelines Deployment Panel";

    restorer.add(widget, widget.id);
    labShell.add(widget, "left");
    return {widget};
}
