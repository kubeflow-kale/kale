import * as React from 'react';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { IRPCError } from '../lib/RPCUtils';
import { Kernel } from '@jupyterlab/services';
import { DeployProgressState } from './deploys-progress/DeploysProgress';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IAnnotation } from '../components/AnnotationInput';
import { ISelectOption } from '../components/Select';
export interface IExperiment {
    id: string;
    name: string;
}
export declare const NEW_EXPERIMENT: IExperiment;
interface IProps {
    lab: JupyterFrontEnd;
    tracker: INotebookTracker;
    docManager: IDocumentManager;
    backend: boolean;
    kernel: Kernel.IKernelConnection;
    rokError: IRPCError;
}
interface IState {
    metadata: IKaleNotebookMetadata;
    runDeployment: boolean;
    deploymentType: string;
    deployDebugMessage: boolean;
    experiments: IExperiment[];
    gettingExperiments: boolean;
    notebookVolumes?: IVolumeMetadata[];
    volumes?: IVolumeMetadata[];
    selectVolumeTypes: ISelectOption[];
    deploys: {
        [index: number]: DeployProgressState;
    };
    isEnabled: boolean;
    katibDialog: boolean;
    namespace: string;
}
export interface IKatibParameter {
    name: string;
    parameterType: 'unknown' | 'double' | 'int' | 'categorical' | 'discrete';
    feasibleSpace: {
        min?: string;
        max?: string;
        list?: string[];
        step?: string;
    };
}
interface IKatibObjective {
    goal?: number;
    type: 'minimize' | 'maximize';
    objectiveMetricName: string;
    additionalMetricNames?: string[];
}
interface IKatibAlgorithm {
    algorithmName: 'random' | 'grid' | 'bayesianoptimization' | 'hyperband' | 'tpe';
    algorithmSettings?: {
        name: string;
        value: string;
    }[];
    earlyStopping?: {
        earlyStoppingAlgorithmName: {
            name: string;
            value: string;
        }[];
    };
}
export interface IKatibMetadata {
    parameters: IKatibParameter[];
    objective: IKatibObjective;
    algorithm: IKatibAlgorithm;
    maxTrialCount: number;
    maxFailedTrialCount: number;
    parallelTrialCount: number;
}
export interface IVolumeMetadata {
    type: string;
    name: string;
    mount_point: string;
    size?: number;
    size_type?: string;
    annotations: IAnnotation[];
    snapshot: boolean;
    snapshot_name?: string;
}
export interface IKaleNotebookMetadata {
    experiment: IExperiment;
    experiment_name: string;
    pipeline_name: string;
    pipeline_description: string;
    docker_image: string;
    volumes: IVolumeMetadata[];
    snapshot_volumes: boolean;
    autosnapshot: boolean;
    katib_run: boolean;
    katib_metadata?: IKatibMetadata;
    steps_defaults?: string[];
    storage_class_name?: string;
    volume_access_mode?: string;
}
export interface IKatibExperiment {
    apiVersion: string;
    name?: string;
    namespace?: string;
    status: string;
    reason: string;
    message: string;
    trials?: number;
    trialsFailed?: number;
    trialsRunning?: number;
    trialsSucceeded?: number;
    maxTrialCount?: number;
    currentOptimalTrial?: {
        bestTrialName: string;
        parameterAssignments: {
            name: string;
            value: string;
        }[];
        observation: {
            metrics: {
                name: string;
                value?: number;
                latest?: string;
                max?: string;
                min?: string;
            }[];
        };
    };
}
export declare const DefaultState: IState;
export declare class KubeflowKaleLeftPanel extends React.Component<IProps, IState> {
    state: IState;
    getActiveNotebook: () => NotebookPanel;
    getActiveNotebookPath: () => string;
    updateExperiment: (experiment: IExperiment) => void;
    updatePipelineName: (name: string) => void;
    updatePipelineDescription: (desc: string) => void;
    updateDockerImage: (name: string) => void;
    updateVolumesSwitch: () => void;
    updateAutosnapshotSwitch: (autosnapshot?: boolean) => void;
    getNotebookMountPoints: () => {
        label: string;
        value: string;
    }[];
    activateRunDeployState: (type: string) => void;
    changeDeployDebugMessage: () => void;
    updateStorageClassName: (storage_class_name: string) => void;
    updateVolumeAccessMode: (volume_access_mode: string) => void;
    updateKatibRun: () => void;
    updateKatibMetadata: (metadata: IKatibMetadata) => void;
    updateVolumes: (volumes: IVolumeMetadata[], metadataVolumes: IVolumeMetadata[]) => void;
    toggleKatibDialog: () => Promise<void>;
    resetState: () => void;
    componentDidMount: () => void;
    componentDidUpdate: (prevProps: Readonly<IProps>, prevState: Readonly<IState>) => void;
    /**
     * This handles when a notebook is switched to another notebook.
     * The parameters are automatically passed from the signal when a switch occurs.
     */
    handleNotebookChanged: (tracker: INotebookTracker, notebook: NotebookPanel) => Promise<void>;
    /**
     * Read new notebook and assign its metadata to the state.
     * @param notebook active NotebookPanel
     */
    setNotebookPanel: (notebook: NotebookPanel) => Promise<void>;
    updateDeployProgress: (index: number, progress: DeployProgressState) => void;
    onPanelRemove: (index: number) => void;
    runDeploymentCommand: () => Promise<void>;
    onMetadataEnable: (isEnabled: boolean) => void;
    render(): JSX.Element;
}
export {};
