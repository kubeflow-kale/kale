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

///<reference path="../node_modules/@types/node/index.d.ts"/>

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer,
} from '@jupyterlab/application';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { ReactWidget } from '@jupyterlab/apputils';

import { Token } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import * as React from 'react';

import '../style/index.css';

import { KubeflowKaleLeftPanel } from './widgets/LeftPanel';
import NotebookUtils from './lib/NotebookUtils';
import {
  executeRpc,
  globalUnhandledRejection,
  BaseError,
  IRPCError,
  RPCError,
  RPC_CALL_STATUS,
} from './lib/RPCUtils';
import { Kernel } from '@jupyterlab/services';
import { PageConfig } from '@jupyterlab/coreutils';

/* tslint:disable */
export const IKubeflowKale = new Token<IKubeflowKale>(
  'kubeflow-kale:IKubeflowKale',
);

export interface IKubeflowKale {
  widget: Widget;
}

const id = 'kubeflow-kale:deploymentPanel';
/**
 * Adds a visual Kubeflow Pipelines Deployment tool to the sidebar.
 */
export default {
  activate,
  id,
  requires: [ILabShell, ILayoutRestorer, INotebookTracker, IDocumentManager],
  provides: IKubeflowKale,
  autoStart: true,
} as JupyterFrontEndPlugin<IKubeflowKale>;

async function activate(
  lab: JupyterFrontEnd,
  labShell: ILabShell,
  restorer: ILayoutRestorer,
  tracker: INotebookTracker,
  docManager: IDocumentManager,
): Promise<IKubeflowKale> {
  let widget: ReactWidget;
  const kernel: Kernel.IKernelConnection = await NotebookUtils.createNewKernel();
  window.addEventListener('beforeunload', () => kernel.shutdown());
  window.addEventListener('unhandledrejection', globalUnhandledRejection);
  // TODO: backend can become an Enum that indicates the type of
  //  env we are in (like Local Laptop, MiniKF, GCP, UI without Kale, ...)
  const backend = await getBackend(kernel);
  let rokError: IRPCError = null;
  if (backend) {
    try {
      await executeRpc(kernel, 'log.setup_logging');
    } catch (error) {
      globalUnhandledRejection({ reason: error });
      throw error;
    }

    try {
      await executeRpc(kernel, 'rok.check_rok_availability');
    } catch (error) {
      const unexpectedErrorCodes = [
        RPC_CALL_STATUS.EncodingError,
        RPC_CALL_STATUS.ImportError,
        RPC_CALL_STATUS.UnhandledError,
      ];
      if (
        error instanceof RPCError &&
        !unexpectedErrorCodes.includes(error.error.code)
      ) {
        rokError = error.error;
        console.warn('Rok is not available', rokError);
      } else {
        globalUnhandledRejection({ reason: error });
        throw error;
      }
    }
  } else {
    rokError = {
      rpc: 'rok.check_rok_availability',
      code: RPC_CALL_STATUS.ImportError,
      err_message: 'Rok is not available',
      err_details:
        'To use this Rok feature you first need Kale running' +
        ' in the backend.',
      err_cls: 'importError',
    };
    console.warn('Rok is not available', rokError);
  }

  /**
   * Detect if Kale is installed
   */
  async function getBackend(kernel: Kernel.IKernelConnection) {
    try {
      await NotebookUtils.sendKernelRequest(kernel, `import kale`, {});
    } catch (error) {
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
      const path = await executeRpc(kernel, 'nb.resume_notebook_path', {
        server_root: PageConfig.getOption('serverRoot'),
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
    widget = ReactWidget.create(
      <KubeflowKaleLeftPanel
        lab={lab}
        tracker={tracker}
        docManager={docManager}
        backend={backend}
        kernel={kernel}
        rokError={rokError}
      />,
    );
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
