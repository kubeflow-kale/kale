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
import { KubeflowKaleLeftPanel } from '../widgets/LeftPanel';
import { KALE_PANEL_ID } from '../widget';

let leftPanelRef: KubeflowKaleLeftPanel | null = null;

export const setLeftPanelRef = (ref: KubeflowKaleLeftPanel | null) => {
  leftPanelRef = ref;
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

      //  disable logic
      const updateState = () => {
        const enabled = leftPanelRef?.isKaleEnabled() ?? false;
        compileBtn.enabled = enabled;
        runBtn.enabled = enabled;
      };

      updateState();
      const interval = setInterval(updateState, 500);
      panel.disposed.connect(() => clearInterval(interval));
    }
  }

  app.docRegistry.addWidgetExtension('Notebook', new KaleToolbarExtension());
}
