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
// import {request} from 'http';
import axios from 'axios';

import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import '../style/index.css';


class InputText extends React.Component<{ label: string, placeholder: string, updateValue: Function, value: string}, any> {
    render() {
        return (
            <div className="input-container">
                <div className="input-wrapper">
                    <input placeholder={this.props.placeholder}
                           value={this.props.value}
                           onChange={evt => this.props.updateValue((evt.target as HTMLInputElement).value)}
                    />
                </div>
            </div>
        )
    }
}

class DeployButton extends React.Component<{callback: Function, deployment: boolean}, any> {

    render() {
        const buttonText = this.props.deployment ? "Running Deployment..." : "Deploy to Kubeflow Pipelines";

        return (
            <div className="deploy-button">
                <button onClick={() => { this.props.callback()} }>
                    { this.props.deployment ?  <FontAwesomeIcon icon={faSyncAlt} spin style={{marginRight: "5px"}}/>: null }
                    <span>{buttonText}</span>
                </button>
            </div>
        )
    }
}


class KubeflowDeploymentUI extends React.Component<
    { tracker: INotebookTracker },
    {
        pipeline_name: string,
        pipeline_description: string,
        running_deployment: boolean,
        deployment_status: string
    }
> {
    state = {
        pipeline_name: '',
        pipeline_description: '',
        running_deployment: false,
        deployment_status: 'No active deployment.'
    };

    updatePipelineName = (name: string) => this.setState({pipeline_name: name});
    updatePipelineDescription = (desc: string) => this.setState({pipeline_description: desc});

    activeNotebookToJSON = () => {
        console.log(this.state.pipeline_name);
        let nb = this.props.tracker.currentWidget;
        if (nb !== null) {
            return nb.content.model.toJSON();
        } else {
            console.log("No Notebook active")
        }
        return null
    };

    deployToKFP = () => {
        this.setState({running_deployment: true});

        const notebook = JSON.stringify(this.activeNotebookToJSON());
        if (notebook === null) {
            console.log("Could not complete deployment operation");
            return
        }

        // send request
        axios.post('http://localhost:5000/kale', {
            deploy: true,
            pipeline_name: this.state.pipeline_name,
            pipeline_descr: this.state.pipeline_description,
            nb: notebook
        }).then((res) => {
            console.log(`statusCode: ${res.status}`);
            console.log(`data: ${res.data}`);
            console.log(res);
            this.setState({deployment_status: res.data['message']})
        }).catch((error) => {
            console.error(error);
            this.setState({deployment_status: "An error occurred during deployment."})
        }).then(() => {
            // always executed
            this.setState({running_deployment: false});
        })
    };

    render() {
        const pipeline_name_input = <InputText
            label={"Pipeline Name"}
            placeholder={"Pipeline Name"}
            updateValue={this.updatePipelineName}
            value={this.state.pipeline_name}
        />;

        const pipeline_desc_input = <InputText
            label={"Pipeline Description"}
            placeholder={"Pipeline Description"}
            updateValue={this.updatePipelineDescription}
            value={this.state.pipeline_description}
        />;
        // const myin = inputComponent("Pipeline Name", "Pipeline Name");
        console.log(this.state.pipeline_name);
        return (
            <div
                style={{
                    background: "var(--jp-layout-color1)",
                    color: "var(--jp-ui-font-color1)",
                    fontFamily: "Helvetica",
                    /* This is needed so that all font sizing of children done in ems is
                    * relative to this base size */
                    fontSize: "var(--jp-ui-font-size1)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "var(--jp-sidebar-min-width)",
                }}
            >

                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header">Kubeflow Pipelines Deployment</p>
                </div>

                {pipeline_name_input}

                {pipeline_desc_input}

                 <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header">Deployment Status</p>
                </div>
                <div style={{margin: "6px 10px"}}>
                    {this.state.deployment_status}
                </div>

                <DeployButton deployment={this.state.running_deployment} callback={this.deployToKFP} />

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
    const widget = ReactWidget.create(
        <KubeflowDeploymentUI
            tracker={tracker}
        />
    );
    widget.id = "kubeflow-kale/kubeflowDeployment";
    widget.title.iconClass = "jp-kubeflow-logo jp-SideBar-tabIcon";
    widget.title.caption = "Kubeflow Pipelines Deployment Panel";

    restorer.add(widget, widget.id);
    labShell.add(widget, "left");
    return {widget};
}
