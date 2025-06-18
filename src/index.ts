import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { reactIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

import { CustomSidePanel } from './panel';

/**
 * The plugin registration information.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'pipeline-builder:plugin',
  description: 'A pipeline builder extension for converting notebooks to Kubeflow Pipelines.',
  autoStart: true,
  optional: [ICommandPalette],
  requires: [INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette
  ) => {
    console.log('JupyterLab extension pipeline-builder is activated!');

    // Function to get current notebook
    const getCurrentNotebook = () => {
      return notebookTracker.currentWidget;
    };

    // Create the side panel
    const panel = new CustomSidePanel(app.serviceManager, getCurrentNotebook);
    panel.id = 'pipeline-builder-panel';
    panel.title.label = 'Pipeline Builder';
    panel.title.icon = reactIcon;

    // Add the panel to the left sidebar
    app.shell.add(panel, 'left', { rank: 500 });

    // Define a command to toggle the panel visibility
    const toggleCommand = 'pipeline-builder:toggle-panel';
    app.commands.addCommand(toggleCommand, {
      label: 'Toggle Pipeline Builder',
      execute: () => {
        if (panel.isVisible) {
          panel.hide();
        } else {
          panel.show();
        }
        app.shell.activateById(panel.id);
      }
    });

    // Add command to palette
    if (palette) {
      palette.addItem({ command: toggleCommand, category: 'Pipeline Builder' });
    }

    // Add toolbar button to notebook when notebook is opened
    notebookTracker.widgetAdded.connect((sender, notebookPanel) => {
      // Create a proper Lumino widget for the toolbar button
      const buttonWidget = new Widget();
      buttonWidget.addClass('jp-ToolbarButton');
      
      const compileButton = document.createElement('button');
      compileButton.textContent = 'Pipeline';
      compileButton.title = 'Compile to Pipeline';
      compileButton.className = 'jp-ToolbarButtonComponent';
      compileButton.style.cssText = `
        background: var(--jp-brand-color1);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 12px;
        cursor: pointer;
        margin: 0;
      `;
      
      compileButton.onclick = () => {
        // Show the panel and trigger compilation
        if (!panel.isVisible) {
          panel.show();
          app.shell.activateById(panel.id);
        }
        // You could also trigger the compilation directly here
      };

      buttonWidget.node.appendChild(compileButton);

      // Add to notebook toolbar
      const toolbar = notebookPanel.toolbar;
      toolbar.addItem('compile-pipeline', buttonWidget);
    });
  }
};

export default plugin;