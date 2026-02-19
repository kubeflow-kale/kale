import { JupyterFrontEnd } from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { LabIcon } from '@jupyterlab/ui-components';
import { KubeflowKaleLeftPanel } from '../widgets/LeftPanel';
import { Notification } from '@jupyterlab/apputils';
import { activateKalePanel } from '../widget';

let leftPanelRef: KubeflowKaleLeftPanel | null = null;

export const setLeftPanelRef = (ref: KubeflowKaleLeftPanel | null) => {
  leftPanelRef = ref;
};

export function registerKaleCommands(app: JupyterFrontEnd, kaleIcon: LabIcon) {
  app.commands.addCommand('kale:compile', {
    label: 'Compile Notebook',
    execute: () => {
      if (!leftPanelRef?.isKaleEnabled()) return;

      Notification.info(
        'Compile started. Follow progress in the Kale left panel.',
        { autoClose: 3000 }
      );
      activateKalePanel();
      leftPanelRef.triggerCompile();
    },
  });

  app.commands.addCommand('kale:run', {
    label: 'Run Pipeline',
    execute: () => {
      if (!leftPanelRef?.isKaleEnabled()) return;

      Notification.info(
        'Pipeline run started. Follow progress in the Kale left panel.',
        { autoClose: 3000 }
      );

      activateKalePanel();
      leftPanelRef.triggerRun();
    },
  });

  class KaleToolbarExtension
    implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
  {
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