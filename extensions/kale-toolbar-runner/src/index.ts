///<reference path="../node_modules/@types/node/index.d.ts"/>

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
    NotebookPanel, INotebookModel
} from '@jupyterlab/notebook';

import { request } from 'http';

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
            console.log(context.model.toJSON());

            // prepare request
            const req = request(
                {
                    host: 'localhost',
                    port: '5000',
                    path: '/kale',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                response => {
                    console.log(response.statusCode); // 200
                }
            );

            req.write(JSON.stringify({
                deploy: 'False',
                pipeline_name: 'JPExtension',
                pipeline_descr: 'JPExtension Description'
            }));

            req.end();


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