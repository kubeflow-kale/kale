import * as React from "react";
import {
    INotebookTracker,
    NotebookPanel
} from "@jupyterlab/notebook";
import NotebookUtils from "../utils/NotebookUtils";

import {
    InputText,
    InputArea,
    DeployButton
} from "./Inputs";

export class KubeflowKaleLeftPanel extends React.Component<
    // props
    {
        tracker: INotebookTracker,
        notebook: NotebookPanel
    },
    // state
    {
        pipeline_name: string,
        pipeline_description: string,
        running_deployment: boolean,
        deployment_status: string,
        deployment_run_link: string,
        volumes: string,
        active_notebook: NotebookPanel
    }>
{
    // init state default values
    state = {
        pipeline_name: '',
        pipeline_description: '',
        running_deployment: false,
        deployment_status: 'No active deployment.',
        deployment_run_link: '',
        volumes: '',
        active_notebook: this.props.notebook
    };

    componentDidMount = () => {
        // Notebook tracker will signal when a notebook is changed
        this.props.tracker.currentChanged.connect(this.handleNotebookChanged, this);

        // Set notebook widget if one is open
        if (this.props.tracker.currentWidget instanceof  NotebookPanel) {
            this.setNotebookPanel(this.props.tracker.currentWidget);
        } else {
            this.setNotebookPanel(null);
        }
    };

    /**
    * This handles when a notebook is switched to another notebook.
    * The parameters are automatically passed from the signal when a switch occurs.
    */
    handleNotebookChanged = (tracker: INotebookTracker, notebook: NotebookPanel) => {
        // Set the current notebook and wait for the session to be ready
        if (notebook) {
            this.setNotebookPanel(notebook);
        } else {
            this.setNotebookPanel(null);
        }
    };

    /**
     * Read new notebook and assign its metadata to the state.
     * @param notebook active NotebookPanel
     */
    setNotebookPanel = (notebook: NotebookPanel) => {
        this.setState({active_notebook: notebook});
        // make sure this is a notebook (no empty page)
        if (notebook) {
            // get notebook metadata
            const kubeflow_mt = NotebookUtils.getMetaData(
                notebook,
                'kubeflow'
            );

        }
    };

    updatePipelineName = (name: string) => this.setState({pipeline_name: name});
    updatePipelineDescription = (desc: string) => this.setState({pipeline_description: desc});
    updateVolumes = (vols: string) => this.setState({volumes: vols});

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

    deployToKFP = async () => {
        this.setState({
            // make deploy button wheel spin
            running_deployment: true,
            deployment_status: 'No active deployment.',
            deployment_run_link: ''
        });

        console.log(this.state.active_notebook.context.path);

        // let active_notebook = this.props.tracker.currentWidget;
        // const code = "a=123\nb=456\nsum=a+b";
        // const expr = {sum: "sum",prod: "a*b",args:"[a,b,sum]"};
        //
        // const cli_code = "output=!ls";
        // const cli_expr = {output: "output"};
        // const output = await NotebookUtils.sendKernelRequest(active_notebook, cli_code, cli_expr, false);
        // console.log(output);
        //
        // console.log('test')
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

        const volumes = <InputArea
            label={"Volumes"}
            placeholder={"Volumes"}
            updateValue={this.updateVolumes}
            value={this.state.volumes}
        />;

        let run_link = null;
        if (this.state.deployment_run_link !== '') {
            run_link = <p>Pipeline run at <a style={{color: "#106ba3"}}
                                             href={this.state.deployment_run_link}
                                             target="_blank">this</a> link.</p>;
        }

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
                    <p style={{fontSize: "var(--jp-ui-font-size1)"}}
                       className="p-CommandPalette-header">
                        Kubeflow Pipelines Control Panel
                    </p>
                </div>

                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header">Pipeline Metadata</p>
                </div>

                {pipeline_name_input}

                {pipeline_desc_input}

                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header">Volumes</p>
                </div>
                {volumes}

                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header">Deployment Status</p>
                </div>
                <div style={{margin: "6px 10px"}}>
                    {this.state.deployment_status}
                    {run_link}
                </div>

                <DeployButton deployment={this.state.running_deployment} callback={this.deployToKFP}/>

            </div>
        );
    }
}