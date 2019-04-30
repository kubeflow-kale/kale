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
            const nb_json_repr = context.model.toJSON();
            const nb_str_repr = JSON.stringify(nb_json_repr);

            // create stream
            // const s = new Readable();
            // s._read = () => {}; // this must be provided
            // s.push(JSON.stringify(nb_json_repr));
            // s.push(null);

            // const form = new FormData();
            // form.append('photo', nb_str_repr);

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
                    console.log(response); // 200
                }
            );

            req.write(JSON.stringify({
                deploy: 'True',
                pipeline_name: 'TestPipelineJP',
                pipeline_descr: 'Pipeline auto-generate from Jupyter Notebook Kale extension',
                nb: nb_str_repr
            }));

            // form.pipe(req);
            req.end();

        };

        let button = new ToolbarButton({
            className: 'kfp-deploy-button',
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