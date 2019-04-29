import {
    IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
    JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
    ToolbarButton
} from '@jupyterlab/apputils';

import {
    DocumentRegistry
} from '@jupyterlab/docregistry';

import {
    NotebookActions, NotebookPanel, INotebookModel
} from '@jupyterlab/notebook';


import '../style/index.css';

/**
 * The plugin registration information.
 */
const plugin: JupyterLabPlugin<void> = {
    activate,
    id: 'kale-toolbar-runner:buttonPlugin',
    autoStart: true
};


/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export
class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
    /**
     * Create a new extension object.
     */
    createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
        let callback = () => {
            NotebookActions.runAll(panel.content, context.session);
        };
        let button = new ToolbarButton({
            className: 'myButton',
            iconClassName: 'fa jp-kale-logo',
            label: "Deploy to KFP",
            iconLabel: "Deploy to KKP",
            onClick: callback,
            tooltip: 'Run All'
        });

        panel.toolbar.insertItem(9, 'runAll', button);
        return new DisposableDelegate(() => {
            button.dispose();
        });
    }
}

/**
 * Activate the extension.
 */
function activate(app: JupyterLab) {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());
}


/**
 * Export the plugin as default.
 */
export default plugin;