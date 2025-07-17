"use strict";
/*
 * Copyright 2019-2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="../node_modules/@types/node/index.d.ts"/>
const application_1 = require("@jupyterlab/application");
const notebook_1 = require("@jupyterlab/notebook");
const docmanager_1 = require("@jupyterlab/docmanager");
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@lumino/coreutils");
const React = __importStar(require("react"));
require("../style/index.css");
const LeftPanel_1 = require("./widgets/LeftPanel");
const NotebookUtils_1 = __importDefault(require("./lib/NotebookUtils"));
const RPCUtils_1 = require("./lib/RPCUtils");
const coreutils_2 = require("@jupyterlab/coreutils");
/* tslint:disable */
exports.IKubeflowKale = new coreutils_1.Token('kubeflow-kale:IKubeflowKale');
const id = 'kubeflow-kale:deploymentPanel';
/**
 * Adds a visual Kubeflow Pipelines Deployment tool to the sidebar.
 */
exports.default = {
    activate,
    id,
    requires: [application_1.ILabShell, application_1.ILayoutRestorer, notebook_1.INotebookTracker, docmanager_1.IDocumentManager],
    provides: exports.IKubeflowKale,
    autoStart: true,
};
async function activate(lab, labShell, restorer, tracker, docManager) {
    let widget;
    const kernel = await NotebookUtils_1.default.createNewKernel();
    window.addEventListener('beforeunload', () => kernel.shutdown());
    window.addEventListener('unhandledrejection', RPCUtils_1.globalUnhandledRejection);
    // TODO: backend can become an Enum that indicates the type of
    //  env we are in (like Local Laptop, MiniKF, GCP, UI without Kale, ...)
    const backend = await getBackend(kernel);
    // let rokError: IRPCError = null;
    // if (backend) {
    //   try {
    //     await executeRpc(kernel, 'log.setup_logging');
    //   } catch (error) {
    //     globalUnhandledRejection({ reason: error });
    //     throw error;
    //   }
    //   try {
    //     await executeRpc(kernel, 'rok.check_rok_availability');
    //   } catch (error) {
    //     const unexpectedErrorCodes = [
    //       RPC_CALL_STATUS.EncodingError,
    //       RPC_CALL_STATUS.ImportError,
    //       RPC_CALL_STATUS.UnhandledError,
    //     ];
    //     if (
    //       error instanceof RPCError &&
    //       !unexpectedErrorCodes.includes(error.error.code)
    //     ) {
    //       rokError = error.error;
    //       console.warn('Rok is not available', rokError);
    //     } else {
    //       globalUnhandledRejection({ reason: error });
    //       throw error;
    //     }
    //   }
    // } else {
    //   rokError = {
    //     rpc: 'rok.check_rok_availability',
    //     code: RPC_CALL_STATUS.ImportError,
    //     err_message: 'Rok is not available',
    //     err_details:
    //       'To use this Rok feature you first need Kale running' +
    //       ' in the backend.',
    //     err_cls: 'importError',
    //   };
    //   console.warn('Rok is not available', rokError);
    // }
    /**
     * Detect if Kale is installed
     */
    async function getBackend(kernel) {
        try {
            await NotebookUtils_1.default.sendKernelRequest(kernel, `import kale`, {});
        }
        catch (error) {
            console.error('Kale backend is not installed.');
            return false;
        }
        return true;
    }
    async function loadPanel() {
        let reveal_widget = undefined;
        if (backend) {
            // Check if KALE_NOTEBOOK_PATH env variable exists and if so load
            // that Notebook
            const path = await RPCUtils_1.executeRpc(kernel, 'nb.resume_notebook_path', {
                server_root: coreutils_2.PageConfig.getOption('serverRoot'),
            });
            if (path) {
                console.log('Resuming notebook ' + path);
                // open the notebook panel
                reveal_widget = docManager.openOrReveal(path);
            }
        }
        // add widget
        if (!widget.isAttached) {
            labShell.add(widget, 'left');
        }
        // open widget if resuming from a notebook
        if (reveal_widget) {
            // open kale panel
            widget.activate();
        }
    }
    // Creates the left side bar widget once the app has fully started
    lab.started.then(() => {
        // show list of commands in the commandRegistry
        // console.log(lab.commands.listCommands());
        widget = apputils_1.ReactWidget.create(React.createElement(LeftPanel_1.KubeflowKaleLeftPanel, { lab: lab, tracker: tracker, docManager: docManager, backend: backend, kernel: kernel, rokError: null }));
        widget.id = 'kubeflow-kale/kubeflowDeployment';
        widget.title.iconClass = 'jp-kale-logo jp-SideBar-tabIcon';
        widget.title.caption = 'Kubeflow Pipelines Deployment Panel';
        widget.node.classList.add('kale-panel');
        restorer.add(widget, widget.id);
    });
    // Initialize once the application shell has been restored
    // and all the widgets have been added to the NotebookTracker
    lab.restored.then(() => {
        loadPanel();
    });
    return { widget };
}
