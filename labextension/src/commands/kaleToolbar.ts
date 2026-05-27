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
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { LabIcon } from '@jupyterlab/ui-components';
import { KALE_PANEL_ID } from '../widget';

export interface ILeftPanelHandle {
  triggerCompile: () => void;
  triggerRun: () => void;
  isKaleEnabled: () => boolean;
  onKaleStateChange?: (enabled: boolean) => void;
}

let leftPanelRef: ILeftPanelHandle | null = null;
let toolbarStateCallback: ((enabled: boolean) => void) | null = null;

export const setLeftPanelCallbacks = (callbacks: ILeftPanelHandle | null) => {
  leftPanelRef = callbacks;

  // Wire up reactive callback when panel becomes available
  if (callbacks && toolbarStateCallback) {
    callbacks.onKaleStateChange = toolbarStateCallback;

    // Sync current state immediately
    toolbarStateCallback(callbacks.isKaleEnabled());
  }
};

function activateKalePanel(app: JupyterFrontEnd) {
  app.commands.execute('tabsmenu:activate-by-id', {
    id: KALE_PANEL_ID,
  });
}
export function registerKaleCommands(app: JupyterFrontEnd, kaleIcon: LabIcon) {
  app.commands.addCommand('kale:compile', {
    label: 'Compile Notebook',
    execute: () => {
      if (!leftPanelRef?.isKaleEnabled()) {
        return;
      }

      activateKalePanel(app);
      leftPanelRef.triggerCompile();
    },
  });

  app.commands.addCommand('kale:run', {
    label: 'Run Pipeline',
    execute: () => {
      if (!leftPanelRef?.isKaleEnabled()) {
        return;
      }

      activateKalePanel(app);
      leftPanelRef.triggerRun();
    },
  });

  class KaleToolbarExtension implements DocumentRegistry.IWidgetExtension<
    NotebookPanel,
    INotebookModel
  > {
    createNew(panel: NotebookPanel) {
      const compileBtn = new ToolbarButton({
        label: 'Compile',
        icon: kaleIcon,
        onClick: () => app.commands.execute('kale:compile'),
      });

      const runBtn = new ToolbarButton({
        label: 'Run',
        icon: kaleIcon,
        onClick: () => app.commands.execute('kale:run'),
      });

      panel.toolbar.addItem('kaleCompile', compileBtn);
      panel.toolbar.addItem('kaleRun', runBtn);

      // Register reactive updater
      toolbarStateCallback = (enabled: boolean) => {
        compileBtn.enabled = enabled;
        runBtn.enabled = enabled;
      };

      // Wire immediately if panel already exists
      if (leftPanelRef) {
        leftPanelRef.onKaleStateChange = toolbarStateCallback;

        // Initial sync
        toolbarStateCallback(leftPanelRef.isKaleEnabled());
      }
    }
  }

  app.docRegistry.addWidgetExtension('Notebook', new KaleToolbarExtension());
}
