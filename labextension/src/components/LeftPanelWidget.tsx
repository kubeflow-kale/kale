import * as React from "react";
import {
    INotebookTracker, Notebook,
    NotebookPanel
} from "@jupyterlab/notebook";
import NotebookUtils from "../utils/NotebookUtils";

import {
    InputText,
    DeployButton,
    CollapsablePanel
} from "./Components";
import {CellTags} from "./CellTags";
import {Cell} from "@jupyterlab/cells";
import {VolumesPanel} from "./VolumesPanel";


const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_noteobok';

interface IProps {
    tracker: INotebookTracker;
    notebook: NotebookPanel
}

interface IState {
    metadata: IKaleNotebookMetadata;
    runningDeployment: boolean;
    deploymentStatus: string;
    deploymentRunLink: string;
    selectVal: string;
    activeNotebook?: NotebookPanel;
    activeCell?: Cell;
    activeCellIndex?: number;
}

interface IKaleNotebookMetadata {
    experimentName: string;
    runName: string;
    pipelineName: string;
    pipelineDescription: string;
    dockerImage: string;
    volumes: string[]
}

const DefaultState: IState = {
        metadata: {
            experimentName: '',
            runName: '',
            pipelineName: '',
            pipelineDescription: '',
            dockerImage: '',
            volumes: []
        },
        runningDeployment: false,
        deploymentStatus: 'No active deployment.',
        deploymentRunLink: '',
        selectVal: '',
        activeNotebook: null,
};

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
];

export class KubeflowKaleLeftPanel extends React.Component<IProps, IState> {
    // init state default values
    state = DefaultState;

    removeIdxFromArray = (index: number, arr: Array<any>): Array<any> => {return arr.slice(0, index).concat(arr.slice(index + 1, arr.length))};

    updateSelectValue = (val: string) => this.setState({selectVal: val});
    // update metadata state values: use destructure operator to update nested dict
    updatePipelineName = (name: string) => this.setState({metadata: {...this.state.metadata, pipelineName: name}});
    updatePipelineDescription = (desc: string) => this.setState({metadata: {...this.state.metadata, pipelineDescription: desc}});
    // deleteVolumeI = (idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.slice(0, idx).concat(this.state.metadata.volumes.slice(idx + 1, this.state.metadata.volumes.length))}});
    deleteVolume = (idx: number) => this.setState({metadata: {...this.state.metadata, volumes: this.removeIdxFromArray(idx, this.state.metadata.volumes)}});
    addVolume = (v: string) => this.setState({metadata: {...this.state.metadata, volumes: [...this.state.metadata.volumes, v]}});
    updateVolume = (idx: number, vol: string) => this.setState({metadata: {...this.state.metadata, volumes: this.state.metadata.volumes.map((item, key) => { return (key === idx) ? vol : item })}});

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
            && this.state.activeNotebook) {
            // Write new metadata to the notebook and save
            NotebookUtils.setMetaData(
                this.state.activeNotebook,
                KALE_NOTEBOOK_METADATA_KEY,
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
            this.setState({activeNotebook: notebook});
            await this.setNotebookPanel(notebook)
        } else {
            this.setState({activeNotebook: null});
            await this.setNotebookPanel(null)
        }
    };

    handleNotebookDisposed = async (notebookPanel: NotebookPanel) => {
        notebookPanel.disposed.disconnect(this.handleNotebookDisposed);
        // reset widget to default state
        this.resetState()
    };

    handleActiveCellChanged = async (notebook: Notebook, activeCell: Cell) => {
        this.setState({activeCell: activeCell, activeCellIndex: notebook.activeCellIndex});
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
            notebook.content.activeCellChanged.connect(this.handleActiveCellChanged);

            // get notebook metadata
            const notebookMetadata = NotebookUtils.getMetaData(
                notebook,
                KALE_NOTEBOOK_METADATA_KEY
            );
            console.log("Kubeflow metadata:");
            console.log(notebookMetadata);
            // if the key exists in the notebook's metadata
            if (notebookMetadata) {
                let metadata: IKaleNotebookMetadata = {
                    experimentName: notebookMetadata['experimentName'] || '',
                    runName: notebookMetadata['runName'] || '',
                    pipelineName: notebookMetadata['pipelineName'] || '',
                    pipelineDescription: notebookMetadata['pipelineDescription'] || '',
                    dockerImage: notebookMetadata['dockerImage'] || '',
                    volumes: notebookMetadata['volumes'] || '',
                };
                this.setState({metadata: metadata})
            }
        }
    };

    deployToKFP = async () => {
        this.setState({
            // make deploy button wheel spin
            runningDeployment: true,
            deploymentStatus: 'No active deployment.',
            deploymentRunLink: ''
        });

        const nbPath = this.state.activeNotebook.context.path;
        const mainCommand = "output=!kale " + nbPath;
        const expr = {output: "output"};
        const output = await NotebookUtils.sendKernelRequest(this.state.activeNotebook, mainCommand, expr, false);
        console.log(output);
    };


    render() {
        const pipeline_name_input = <InputText
            label={"Pipeline Name"}
            placeholder={"Pipeline Name"}
            updateValue={this.updatePipelineName}
            value={this.state.metadata.pipelineName}
        />;

        const pipeline_desc_input = <InputText
            label={"Pipeline Description"}
            placeholder={"Pipeline Description"}
            updateValue={this.updatePipelineDescription}
            value={this.state.metadata.pipelineDescription}
        />;

        const volsPanel = <VolumesPanel
            volumes={this.state.metadata.volumes}
            addVolume={this.addVolume}
            updateVolume={this.updateVolume}
            deleteVolume={this.deleteVolume}
        />;

        let run_link = null;
        if (this.state.deploymentRunLink !== '') {
            run_link = <p>
                Pipeline run at
                <a style={{color: "#106ba3"}}
                     href={this.state.deploymentRunLink}
                     target="_blank">this
                </a> link.</p>;
        }

        return (
            <div className={"kubeflow-widget"}>

                <div style={{overflow: "auto"}}>
                    <p style={{fontSize: "var(--jp-ui-font-size1)"}}
                       className="p-CommandPalette-header">
                        Kale Control Panel
                    </p>
                </div>

                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header">Pipeline Metadata</p>
                </div>

                {pipeline_name_input}
                {pipeline_desc_input}
                {volsPanel}

                {/*  CELLTAGS PANEL  */}
                <CellTags
                    notebook={this.state.activeNotebook}
                    activeCellIndex={this.state.activeCellIndex}
                    activeCell={this.state.activeCell}
                />
                {/*  --------------  */}

                <div style={{overflow: "auto"}}>
                    <p className="p-CommandPalette-header">Deployment Status</p>
                </div>
                <div className='p-Widget jp-KeySelector' style={{color: "var(--jp-ui-font-color3)", margin: "10px"}}>
                    {this.state.deploymentStatus}
                    {run_link}
                </div>

                <CollapsablePanel title={"Advanced Settings"}/>

                <DeployButton deployment={this.state.runningDeployment} callback={this.deployToKFP}/>

            </div>
        );
    }
}