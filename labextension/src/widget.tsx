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
import { executeRpc, globalUnhandledRejection, BaseError } from "./utils/RPCUtils";
import { Kernel } from "@jupyterlab/services";


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
    const kernel: Kernel.IKernel = await NotebookUtils.createNewKernel();
    window.addEventListener("beforeunload", () => kernel.shutdown());
    window.addEventListener('unhandledrejection', globalUnhandledRejection);
    // TODO: backend can become an Enum that indicates the type of
    //  env we are in (like Local Laptop, MiniKF, GCP, UI without Kale, ...)
    const backend = await getBackend(kernel);
    if (backend) {
        try {
            await executeRpc(kernel, 'log.setup_logging');
        } catch (error) {
            globalUnhandledRejection({reason: error});
            throw error;
        }
    }

    /**
     * Detect if Kale is installed
     */
    async function getBackend(kernel: Kernel.IKernel) {
        try {
            await NotebookUtils.sendKernelRequest(
                kernel,
                `import kale`,
                {});
        } catch (error) {
            console.error("Kale backend is not installed.");
            return false
        }
        return true
    }

    async function loadPanel() {
        let reveal_widget = undefined;
        if (backend) {
            // Check if NOTEBOOK_PATH env variable exists and if so load
            // that Notebook
            const path = await executeRpc(kernel, "nb.resume_notebook_path");
            if (path) {
                console.log("Resuming notebook " + path);
                // open the notebook panel
                reveal_widget = docManager.openOrReveal(path);
            }
        }

        // add widget
        if (!widget.isAttached) {
            labShell.add(widget, "left");
        }
        // open widget if resuming from a notebook
        if (reveal_widget) {
            // open kale panel
            widget.activate()
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
                backend={backend}
                kernel={kernel}
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
        loadPanel();
    });

    return {widget};
}
