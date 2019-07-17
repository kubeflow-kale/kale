///<reference path="../node_modules/@types/node/index.d.ts"/>

import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
    ILabShell,
    ILayoutRestorer
} from "@jupyterlab/application";

import {
    INotebookTracker
} from '@jupyterlab/notebook';

import {ReactWidget} from "@jupyterlab/apputils";

import {Token} from "@phosphor/coreutils";
import {Widget} from "@phosphor/widgets";
import * as React from "react";
import {style} from "typestyle";

import {request} from 'http';

import '../style/index.css';

const buttonClassName = style({
    color: "#2196F3",
    borderRadius: 2,
    background: "#FFFFFF",i
    fontSize: 10,
    borderWidth: 0,
    marginRight: 12, // 2 + 10 spacer between
    padding: "2px 4px",
    $nest: {
        "&:active": {
            background: "#BDBDBD"
        },
        "&:active:hover": {
            background: "#BDBDBD"
        },
        "&:hover": {
            background: "#E0E0E0"
        }
    }
});

function Button({onClick, text}: { onClick: () => void; text: string }) {
    return (
        <button
            className={buttonClassName}
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
        >
            {text}
        </button>
    );
}


class KubeflowDeploymentUI extends React.Component<{
    tracker: INotebookTracker;
},
    { search: string }> {
    state: {
        search: string
    } = {
        search: ""
    };

    deployToKFP = (notebook: String) => {

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
            pipeline_name: 'test_pipeline',
            pipeline_descr: 'Auto-generated pipeline from the Jupyter Notebook Kale extension',
            nb: notebook
        }));
        req.end();

    };

    render() {
        return (
            <div
                style={{
                    background: "var(--jp-layout-color1)",
                    color: "#000000",
                    fontFamily: "Helvetica",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
                }}
            >

                <div style={{overflow: "auto"}}>
                    <p>Kubeflow Pipelines Deployment</p>
                </div>
                <Button
                    onClick={() => {
                        let nb = this.props.tracker.currentWidget;
                        if (nb !== null) {
                            const nb_json = nb.content.model.toJSON();
                            console.log(nb_json);
                            this.deployToKFP(JSON.stringify(nb_json))
                        } else {
                            console.log("No Notebook active")
                        }

                    }}
                    text="Deploy to KFP"
                />
            </div>
        );
    }
}

/* tslint:disable */
export const IKubeflowKale = new Token<IKubeflowKale>(
    "kubeflow-kale:IKubeflowKale"
);

export interface IKubeflowKale {
    widget: Widget;
}

const id = "kubeflow-kale:deploymentPanel";
/**
 * Adds a visual Kubeflow Pipelines Deployment tool to the sidebar.
 */
export default {
    activate,
    id,
    requires: [ILabShell, ILayoutRestorer, INotebookTracker],
    provides: IKubeflowKale,
    autoStart: true
} as JupyterFrontEndPlugin<IKubeflowKale>;

function activate(
    lab: JupyterFrontEnd,
    labShell: ILabShell,
    restorer: ILayoutRestorer,
    tracker: INotebookTracker
): IKubeflowKale {
    // Create a dataset with this URL
    const widget = ReactWidget.create(
        <KubeflowDeploymentUI
            tracker={tracker}
        />
    );
    widget.id = "kubeflow-kale/kubeflowDeployment";
    widget.title.iconClass = "jp-kubeflow-logo jp-SideBar-tabIcon";  // old icon: jp-SpreadsheetIcon
    widget.title.caption = "Kubeflow Pipelines Deployment Panel";

    restorer.add(widget, widget.id);
    labShell.add(widget, "left");
    return {widget};
}
