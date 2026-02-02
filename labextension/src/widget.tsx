// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer,
} from '@jupyterlab/application';

import { INotebookTracker } from '@jupyterlab/notebook';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { ReactWidget } from '@jupyterlab/apputils';

import { Token } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import * as React from 'react';

import '../style/index.css';
import kaleIconSvg from '../style/icons/kale.svg';

import { KubeflowKaleLeftPanel } from './widgets/LeftPanel';
import NotebookUtils from './lib/NotebookUtils';
import { executeRpc, globalUnhandledRejection } from './lib/RPCUtils';
import { Kernel } from '@jupyterlab/services';
import { PageConfig } from '@jupyterlab/coreutils';
import { LabIcon } from '@jupyterlab/ui-components';

/* tslint:disable */
export const IKubeflowKale = new Token<IKubeflowKale>(
  'kubeflow-kale-labextension:IKubeflowKale',
);

export interface IKubeflowKale {
  widget: Widget;
}

const id = 'kubeflow-kale-labextension:deploymentPanel';

const kaleIcon = new LabIcon({ name: 'kale:logo', svgstr: kaleIconSvg });

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
  let widget: ReactWidget | undefined;
  const kernel: Kernel.IKernelConnection =
    await NotebookUtils.createNewKernel();
  window.addEventListener('beforeunload', () => kernel.shutdown());
  window.addEventListener('unhandledrejection', globalUnhandledRejection);

  /**
   * Detect if Kale is installed
   */
  async function getBackend(kernel: Kernel.IKernelConnection) {
    try {
      await NotebookUtils.sendKernelRequest(kernel, 'import kale', {});
    } catch (error) {
      console.error(`Kale backend is not installed: ${error}`);

      return false;
    }
    return true;
  }

  // TODO: backend can become an Enum that indicates the type of
  //  env we are in (like Local Laptop, MiniKF, GCP, UI without Kale, ...)
  const backend = await getBackend(kernel);
  if (backend) {
    try {
      await executeRpc(kernel, 'log.setup_logging');
    } catch (error) {
      globalUnhandledRejection({ reason: error });
      throw error;
    }
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
    if (widget && !widget.isAttached) {
      labShell.add(widget, 'left');
    }
    // open widget if resuming from a notebook
    if (reveal_widget && widget) {
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
      />,
    );
    widget.id = 'kubeflow-kale-labextension/kubeflowDeployment';
    widget.title.icon = kaleIcon;
    widget.title.caption = 'Kubeflow Pipelines Deployment Panel';
    widget.node.classList.add('kale-panel');

    restorer.add(widget, widget.id);
  });

  // Initialize once the application shell has been restored
  // and all the widgets have been added to the NotebookTracker
  lab.restored.then(() => {
    loadPanel();
  });

  return {
    get widget() {
      if (!widget) {
        throw new Error('Widget not initialized yet');
      }
      return widget;
    },
  };
}
