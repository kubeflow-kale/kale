///<reference path="../node_modules/@types/node/index.d.ts"/>

import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
    ILabShell,
    ILayoutRestorer
} from "@jupyterlab/application";

import {
    INotebookTracker, NotebookPanel
} from '@jupyterlab/notebook';

import {
    IDocumentManager
} from '@jupyterlab/docmanager';

import {ReactWidget} from "@jupyterlab/apputils";

import {Token} from "@phosphor/coreutils";
import {Widget} from "@phosphor/widgets";
import * as React from "react";

import '../style/index.css';

import {KubeflowKaleLeftPanel} from './components/LeftPanelWidget'
import NotebookUtils from "./utils/NotebookUtils";


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
    requires: [ILabShell, ILayoutRestorer, INotebookTracker, IDocumentManager],
    provides: IKubeflowKale,
    autoStart: true
} as JupyterFrontEndPlugin<IKubeflowKale>;


async function activate(
    lab: JupyterFrontEnd,
    labShell: ILabShell,
    restorer: ILayoutRestorer,
    tracker: INotebookTracker,
    docManager: IDocumentManager,
): Promise<IKubeflowKale> {

    let widget: ReactWidget;

    async function load_notebook() {
        let k = await NotebookUtils.createNewKernel();
        const cmd: string = `import os\n`
            + `home=os.environ.get("NOTEBOOK_PATH")`;
        console.log("Executing command: " + cmd);
        const expressions = {result: "home"};
        const output = await NotebookUtils.sendKernelRequest(k, cmd, expressions);
        const notebookPath = output.result['data']['text/plain'];
        if (notebookPath !== 'None') {
            console.log("Resuming notebook " + notebookPath);
            // open the notebook panel
            docManager.openOrReveal(notebookPath);
        }
    }

    // Creates the left side bar widget once the app has fully started
    lab.started.then(() => {
        // show list of commands in the commandRegistry
        // console.log(lab.commands.listCommands());
        widget = ReactWidget.create(
            <KubeflowKaleLeftPanel
                lab={lab}
                tracker={tracker}
                notebook={tracker.currentWidget}
                docManager={docManager}
            />
        );
        widget.id = "kubeflow-kale/kubeflowDeployment";
        widget.title.iconClass = "jp-kubeflow-logo jp-SideBar-tabIcon";
        widget.title.caption = "Kubeflow Pipelines Deployment Panel";

        restorer.add(widget, widget.id);
    });

    // Initialize once the application shell has been restored
    // and all the widgets have been added to the NotebookTracker
    lab.restored.then(() => {
        load_notebook();
        if (!widget.isAttached) {
                labShell.add(widget, "left");
            }
    });

    return {widget};
}
