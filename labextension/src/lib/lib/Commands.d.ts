import { Kernel } from '@jupyterlab/services';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IExperiment, IKaleNotebookMetadata, IKatibExperiment, IVolumeMetadata } from '../widgets/LeftPanel';
import { IDocumentManager } from '@jupyterlab/docmanager';
interface IUploadPipelineResp {
    already_exists: boolean;
    pipeline: {
        pipelineid: string;
        versionid: string;
        name: string;
    };
}
export default class Commands {
    private readonly _notebook;
    private readonly _kernel;
    constructor(notebook: NotebookPanel, kernel: Kernel.IKernelConnection);
    snapshotNotebook: () => Promise<any>;
    getSnapshotProgress: (task_id: string, ms?: number) => Promise<any>;
    runSnapshotProcedure: (onUpdate: Function) => Promise<any>;
    replaceClonedVolumes: (bucket: string, obj: string, version: string, volumes: IVolumeMetadata[]) => Promise<any>;
    getMountedVolumes: (currentNotebookVolumes: IVolumeMetadata[]) => Promise<{
        notebookVolumes: IVolumeMetadata[];
        selectVolumeTypes: import("../components/Select").ISelectOption[];
    }>;
    unmarshalData: (nbFileName: string) => Promise<void>;
    getBaseImage: () => Promise<string>;
    getExperiments: (experiment: {
        id: string;
        name: string;
    }, experimentName: string) => Promise<{
        experiments: IExperiment[];
        experiment: IExperiment;
        experiment_name: string;
    }>;
    pollRun(runPipeline: any, onUpdate: Function): void;
    pollKatib(katibExperiment: IKatibExperiment, onUpdate: Function): void;
    validateMetadata: (notebookPath: string, metadata: IKaleNotebookMetadata, onUpdate: Function) => Promise<boolean>;
    /**
     * Analyse the current metadata and produce some warning to be shown
     * under the compilation task
     * @param metadata Notebook metadata
     */
    getCompileWarnings: (metadata: IKaleNotebookMetadata) => string[];
    compilePipeline: (notebookPath: string, metadata: IKaleNotebookMetadata, docManager: IDocumentManager, deployDebugMessage: boolean, onUpdate: Function) => Promise<any>;
    uploadPipeline: (compiledPackagePath: string, compiledPipelineMetadata: IKaleNotebookMetadata, onUpdate: Function) => Promise<IUploadPipelineResp>;
    runKatib: (notebookPath: string, metadata: IKaleNotebookMetadata, pipelineId: string, versionId: string, onUpdate: Function) => Promise<IKatibExperiment>;
    runPipeline: (pipelineId: string, versionId: string, compiledPipelineMetadata: IKaleNotebookMetadata, onUpdate: Function) => Promise<any>;
    resumeStateIfExploreNotebook: (notebookPath: string) => Promise<void>;
    findPodDefaultLabelsOnServer: () => Promise<{
        [key: string]: string;
    }>;
    getNamespace: () => Promise<string>;
}
export {};
