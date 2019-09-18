import * as React from "react";
import {
    INotebookTracker,
    NotebookPanel
} from "@jupyterlab/notebook";
import NotebookUtils from "../utils/NotebookUtils";

import {
    InputText,
    InputArea,
    DeployButton,
    SelectBox,
    CollapsablePanel
} from "./Components";


const KUBEFLOW_METADATA_KEY = 'kubeflow';

interface IProps {
    tracker: INotebookTracker;
    notebook: NotebookPanel
}

interface IState {
    metadata: IKubeflowMetadata;
    running_deployment: boolean;
    deployment_status: string;
    deployment_run_link: string;
    active_notebook?: NotebookPanel;
    selectval: string
}

interface IKubeflowMetadata {
    experiment_name: string,
    run_name: string,
    pipeline_name: string,
    pipeline_description: string,
    docker_image: string,
    volumes: string,
}

const DefaultState: IState = {
        metadata: {
            experiment_name: '',
            run_name: '',
            pipeline_name: '',
            pipeline_description: '',
            docker_image: '',
            volumes: ''
        },
        running_deployment: false,
        deployment_status: 'No active deployment.',
        deployment_run_link: '',
        active_notebook: null,
        selectval: ''
    };

export class KubeflowKaleLeftPanel extends React.Component<IProps, IState> {
    // init state default values
    state = DefaultState;

    updateSelectValue = (val: string) => this.setState({selectval: val});
    // update metadata state values: use destructure operator to update nested dict
    updatePipelineName = (name: string) => this.setState({metadata: {...this.state.metadata, pipeline_name: name}});
    updatePipelineDescription = (desc: string) => this.setState({metadata: {...this.state.metadata, pipeline_description: desc}});
    updateVolumes = (vols: string) => this.setState({metadata: {...this.state.metadata, volumes: vols}});
    // restore state to default values
    resetState = () => this.setState({...DefaultState, ...DefaultState.metadata});

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

    componentDidUpdate = (prevProps: Readonly<IProps>, prevState: Readonly<IState>) => {
        // fast comparison of Metadata objects.
        // warning: this method does not work if keys change order.
        if (JSON.stringify(prevState.metadata) !== JSON.stringify(this.state.metadata)
            && this.state.active_notebook) {
            // Write new metadata to the notebook and save
            NotebookUtils.setMetaData(
                this.state.active_notebook,
                KUBEFLOW_METADATA_KEY,
                this.state.metadata,
                true)
        }
    };

    /**
    * This handles when a notebook is switched to another notebook.
    * The parameters are automatically passed from the signal when a switch occurs.
    */
    handleNotebookChanged = async (tracker: INotebookTracker, notebook: NotebookPanel) => {
        // Set the current notebook and wait for the session to be ready
        if (notebook) {
            this.setState({active_notebook: notebook});
            await this.setNotebookPanel(notebook)
        } else {
            this.setState({active_notebook: null});
            await this.setNotebookPanel(null)
        }
    };

    handleNotebookDisposed = async (notebookPanel: NotebookPanel) => {
        notebookPanel.disposed.disconnect(this.handleNotebookDisposed);
        // reset widget to default state
        this.resetState()
    };

    /**
     * Read new notebook and assign its metadata to the state.
     * @param notebook active NotebookPanel
     */
    setNotebookPanel = async (notebook: NotebookPanel) => {
        // if there at least an open notebook
        if (this.props.tracker.size > 0 && notebook) {
            // wait for the session to be ready before reading metadata
            await notebook.session.ready;
            notebook.disposed.connect(this.handleNotebookDisposed);

            // get notebook metadata
            const kubeflow_metadata = NotebookUtils.getMetaData(
                notebook,
                KUBEFLOW_METADATA_KEY
            );
            console.log("Kubeflow metadata:");
            console.log(kubeflow_metadata);
            // if the key exists in the notebook's metadata
            if (kubeflow_metadata) {
                let metadata: IKubeflowMetadata = {
                    experiment_name: kubeflow_metadata['experiment_name'] || '',
                    run_name: kubeflow_metadata['run_name'] || '',
                    pipeline_name: kubeflow_metadata['pipeline_name'] || '',
                    pipeline_description: kubeflow_metadata['pipeline_description'] || '',
                    docker_image: kubeflow_metadata['docker_image'] || '',
                    volumes: kubeflow_metadata['volumes'] || '',
                };
                this.setState({metadata: metadata})
            }
        }
    };

    deployToKFP = async () => {
        this.setState({
            // make deploy button wheel spin
            running_deployment: true,
            deployment_status: 'No active deployment.',
            deployment_run_link: ''
        });

        const nb_path = this.state.active_notebook.context.path;
        const main_command = "output=!kale " + nb_path;
        const expr = {output: "output"};
        const output = await NotebookUtils.sendKernelRequest(this.state.active_notebook, main_command, expr, false);
        console.log(output);
    };

    render() {
        const pipeline_name_input = <InputText
            label={"Pipeline Name"}
            placeholder={"Pipeline Name"}
            updateValue={this.updatePipelineName}
            value={this.state.metadata.pipeline_name}
        />;

        const pipeline_desc_input = <InputText
            label={"Pipeline Description"}
            placeholder={"Pipeline Description"}
            updateValue={this.updatePipelineDescription}
            value={this.state.metadata.pipeline_description}
        />;

        const volumes = <InputArea
            label={"Volumes"}
            placeholder={"Volumes"}
            updateValue={this.updateVolumes}
            value={this.state.metadata.volumes}
        />;

        const selectbox = <SelectBox label={"Select previous block"} updateValue={this.updateSelectValue} value={this.state.selectval} values={['A', 'B', 'C']} />;

        let run_link = null;
        if (this.state.deployment_run_link !== '') {
            run_link = <p>Pipeline run at <a style={{color: "#106ba3"}}
                                             href={this.state.deployment_run_link}
                                             target="_blank">this</a> link.</p>;
        }

        return (
            <div className={"kubeflow-widget"}>

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


                <div style={{overflow: "auto"}}>
                    {selectbox}
                </div>

                <CollapsablePanel title={"Advanced Settings"}/>

                <DeployButton deployment={this.state.running_deployment} callback={this.deployToKFP}/>

            </div>
        );
    }
}