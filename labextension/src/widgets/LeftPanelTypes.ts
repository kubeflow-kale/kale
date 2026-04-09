export type DeployType = 'compile' | 'run' | 'upload';

export interface IExperiment {
  id: string;
  name: string;
}

export const NEW_EXPERIMENT: IExperiment = {
  name: '+ New Experiment',
  id: 'new',
};

// keep names with Python notation because they will be read
// in python by Kale.
export interface IKaleNotebookMetadata {
  experiment: IExperiment;
  experiment_name: string; // Keep this for backwards compatibility
  pipeline_name: string;
  pipeline_description: string;
  base_image: string;
  enable_caching?: boolean;

  steps_defaults?: string[];
  storage_class_name?: string;
}

export const DefaultState = {
  metadata: {
    experiment: { id: '', name: '' },
    experiment_name: '',
    pipeline_name: '',
    pipeline_description: '',
    base_image: '',
    enable_caching: true,
    steps_defaults: [] as string[],
  } as IKaleNotebookMetadata,
};
