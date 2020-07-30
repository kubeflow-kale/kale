import * as React from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Divider,
  Typography,
  IconButton,
  CircularProgress,
  Zoom,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import Help from '@material-ui/icons/Help';
import DeleteIcon from '@material-ui/icons/Delete';
import { IKatibMetadata, IKatibParameter } from './LeftPanel';
import { NotebookPanel } from '@jupyterlab/notebook';
import { executeRpc, RPC_CALL_STATUS, RPCError } from '../lib/RPCUtils';
import { Kernel } from '@jupyterlab/services';
import { useTheme } from '@material-ui/core/styles';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { LightTooltip } from '../components/LightTooltip';

// python to katib types
const katibTypeMapper: { [id: string]: string } = {
  int: 'int',
  float: 'double',
  str: 'categorical',
};

const algorithmOptions = [
  { value: 'random', label: 'Random Search' },
  { value: 'grid', label: 'Grid Search' },
  { value: 'bayesianoptimization', label: 'Bayesian Optimization' },
  { value: 'hyperband', label: 'Hyperband' },
  { value: 'tpe', label: 'Hyperopt TPE' },
];

// https://github.com/scikit-optimize/scikit-optimize/blob/master/skopt/optimizer/optimizer.py#L55
const estimatorOptions = [
  { value: 'GP', label: 'Gaussian Process Regressor (GP)' },
  { value: 'RF', label: 'Random Forest Regressor (RF)' },
  { value: 'ET', label: 'Extra Trees Regressor (ET)' },
  { value: 'GBRT', label: 'Gradient Boosting Regressor (GBRT)' },
];

// https://github.com/scikit-optimize/scikit-optimize/blob/master/skopt/optimizer/optimizer.py#L84
const acqFuncOptions = [
  { value: 'LCB', label: 'Lower Confidence Bound (LCB)' },
  { value: 'EI', label: 'Negative Expected Improvement (EI)' },
  { value: 'PI', label: 'Negative Probability of Improvement (PI)' },
  { value: 'gp_hedge', label: 'Choose Probabilistically (gp_hedge)' },
  { value: 'EIps', label: 'EI + Function Compute Time (EIps)' },
  { value: 'PIps', label: 'PI + Function Compute Time (PIps)' },
];

interface KabitDialog {
  open: boolean;
  nbFilePath: string;
  toggleDialog: Function;
  katibMetadata: IKatibMetadata;
  updateKatibMetadata: Function;
  kernel: Kernel.IKernelConnection;
}

export const KatibDialog: React.FunctionComponent<KabitDialog> = props => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [pipelineParameters, setPipelineParameters] = React.useState([]);
  const [pipelineMetrics, setPipelineMetrics] = React.useState([]);

  const theme = useTheme();

  React.useEffect(() => {
    // this is called when `open` changes value.
    // We are interested in the case when `open` becomes true.
    if (props.open) {
      // send RPC to retrieve current pipeline parameters and
      // update the state
      onKatibShowPanel();
    }
  }, [props.open]);

  const onKatibShowPanel = async () => {
    // Send an RPC to Kale to get the pipeline parameters
    // that are currently defined in the notebook
    const args = { source_notebook_path: props.nbFilePath };

    let rpcPipelineParameters = [];
    try {
      rpcPipelineParameters = await executeRpc(
        props.kernel,
        'nb.get_pipeline_parameters',
        args,
      );
    } catch (error) {
      if (
        error instanceof RPCError &&
        error.error.code === RPC_CALL_STATUS.InternalError
      ) {
        console.warn(
          'InternalError while parsing the notebook for' +
            ' pipeline parameters',
          error.error,
        );
        setError(error.error.err_details);
        setLoading(false);
        return;
      } else {
        // close Katib dialog before showing the error dialog
        props.toggleDialog();
        throw error;
      }
    }

    // Send an RPC to Kale to get the pipeline metrics
    // that are currently defined in the notebook
    let rpcPipelineMetrics: any = [];
    try {
      rpcPipelineMetrics = await executeRpc(
        props.kernel,
        'nb.get_pipeline_metrics',
        args,
      );
    } catch (error) {
      if (
        error instanceof RPCError &&
        error.error.code === RPC_CALL_STATUS.InternalError
      ) {
        console.warn(
          'InternalError while parsing the notebook for' + ' pipeline metrics',
          error.error,
        );
        setError(error.error.err_details);
        setLoading(false);
        return;
      } else {
        // close Katib dialog before showing the error dialog
        props.toggleDialog();
        throw error;
      }
    }
    setPipelineMetrics(
      Object.keys(rpcPipelineMetrics).map((x: string) => {
        return { label: rpcPipelineMetrics[x], value: x };
      }),
    );

    // now that we have new parameters from the RPC, check what are the
    // parameters currently stored in the notebook metadata. In case the
    // objectiveMetricName matches one of the RPC parameters, then keep it.
    // Otherwise we empty the field from the Notebook metadata.
    let newObjectiveMetricName = '';
    let newAdditionalMetricNames: string[] = [];
    if (
      Object.keys(rpcPipelineMetrics).includes(
        props.katibMetadata.objective.objectiveMetricName,
      )
    ) {
      newObjectiveMetricName =
        props.katibMetadata.objective.objectiveMetricName;
      newAdditionalMetricNames = Object.keys(rpcPipelineMetrics).filter(
        x => x !== props.katibMetadata.objective.objectiveMetricName,
      );
    }

    type IParameter = [boolean, string, string, string];
    const paramsWithRequired: IParameter[] = rpcPipelineParameters.map(
      (x: IParameter) => [false, ...x],
    );
    // a pipeline parameter is in the format: [<required>, <name>, <type>, <value>]
    // merge existing notebook parameters (tagged by `pipeline-parameters`)
    // with the parameters already present in the notebook's Katib Metadata
    // @ts-ignore
    const katibParameters: IKatibParameter[] = paramsWithRequired
      // first filter out all pipeline parameters that have types not
      // supported by Katib
      .filter(param => katibTypeMapper[param[2]] !== undefined)
      // keep only the parameter that have a corresponding entry in the
      // notebook's katib metadata
      .filter(param => {
        const new_param_name = param[1];
        const new_param_type = katibTypeMapper[param[2]];
        // check if this parameter is already part of the notebook's
        // Katib metadata
        const existing_param = props.katibMetadata.parameters.filter(
          x => x.name === new_param_name,
        );
        return (
          existing_param.length > 0 &&
          // in case the new parameter is numeric, don't validate its type
          // because it could have been set to categorical by the user in a
          // previous Dialog interaction
          (['int', 'double'].includes(new_param_type) &&
          existing_param[0].parameterType == 'categorical'
            ? true
            : existing_param[0].parameterType === new_param_type)
        );
      })
      // get the matching entries of the notebook's metadata (there might be
      // others that we don't need)
      .map(
        param =>
          props.katibMetadata.parameters.filter(x => x.name === param[1])[0],
      );

    // set the detected parameters as required, because they are already present
    // in the notebook metadata
    setPipelineParameters(
      paramsWithRequired.map(p =>
        // check if the parameter is present inside the katibParameters list of
        // objects
        katibParameters.filter(kp => kp.name === p[1]).length > 0
          ? [true, ...p.slice(1)]
          : p,
      ),
    );
    // Now, with the result, update the state to save these parameters
    // to katib metadata
    props.updateKatibMetadata({
      ...props.katibMetadata,
      parameters: katibParameters,
      objective: {
        ...props.katibMetadata.objective,
        objectiveMetricName: newObjectiveMetricName,
        additionalMetricNames: newAdditionalMetricNames,
      },
    });

    setLoading(false);
  };

  const handleClose = () => {
    props.toggleDialog();
    // next time the user open this dialog it will need
    // to call onKatibShowPanel again
    setError('');
    setLoading(true);
  };

  /**
   * TODO: Add docs
   */
  const updateParameter = (parameter: string, action: Function) => (
    value?: string,
  ) => {
    // update the metadata field of a specific parameter (e.g. min, max values)
    const currentParameterIndex = props.katibMetadata.parameters.findIndex(
      x => x.name === parameter,
    );
    // now get elements with shallow copies
    let currentParameters = [...props.katibMetadata.parameters];
    // get parameter and update field (`min`, `max`)
    let updatedParameter = { ...currentParameters[currentParameterIndex] };

    action(updatedParameter, value);

    // replace old parameter at position idx with the updated one.
    // currentParameters.splice(currentParameterIndex, 1, updatedParameter);
    currentParameters[currentParameterIndex] = updatedParameter;
    props.updateKatibMetadata({
      ...props.katibMetadata,
      parameters: currentParameters,
    });
  };

  const updateParameterFeasibleSpaceRange = (field: 'min' | 'max' | 'step') => (
    parameter: IKatibParameter,
    value: string,
  ) => {
    // either min, max or step
    parameter.feasibleSpace = { ...parameter.feasibleSpace, [field]: value };
  };

  const updateParameterFeasibleSpaceList = (idx: number) => (
    parameter: IKatibParameter,
    value: string,
  ) => {
    // update a categorical parameter, idx is the index of the value in the list
    // get the current parameter categorical list
    let newParameterList = [...parameter.feasibleSpace.list];
    newParameterList[idx] = value;
    parameter.feasibleSpace = {
      ...parameter.feasibleSpace,
      list: newParameterList,
    };
  };

  const updateParameterList = (operation: 'add' | 'delete', idx: number) => (
    parameter: IKatibParameter,
  ) => {
    let parameterList =
      parameter.feasibleSpace.list === undefined
        ? []
        : [...parameter.feasibleSpace.list];
    operation === 'add'
      ? // add a new category at the end of the list
        parameterList.push('')
      : // else operation=`delete`: remove 1 element at position idx
        parameterList.splice(idx, 1);
    parameter.feasibleSpace = {
      ...parameter.feasibleSpace,
      list: parameterList,
    };
  };

  const updateNumericParameterType = (
    parameterName: string,
    parameterOriginalType: 'int' | 'double',
  ) => (parameter: IKatibParameter, value: string) => {
    if (value === 'list') {
      parameter.parameterType = 'categorical';
      delete parameter.feasibleSpace.max;
      delete parameter.feasibleSpace.min;
      delete parameter.feasibleSpace.step;
    } else {
      // value === "range"
      parameter.parameterType = parameterOriginalType;
      delete parameter.feasibleSpace.list;
    }
  };

  const updateObjectiveMetricName = (value: string) => {
    props.updateKatibMetadata({
      ...props.katibMetadata,
      objective: {
        ...props.katibMetadata.objective,
        objectiveMetricName: value,
        // add all the other metrics to the additionalMetricsNames
        // pipeline metrics is of type {label: string, value: string}[]
        additionalMetricNames: pipelineMetrics
          .filter(x => x.value !== value)
          .map(x => x.value),
      },
    });
  };

  const updateParameterRequired = (
    parameterName: string,
    parameterType: string,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      // add a new parameter entry in the notebook metadata
      props.updateKatibMetadata({
        ...props.katibMetadata,
        parameters: [
          ...props.katibMetadata.parameters,
          {
            name: parameterName,
            parameterType: parameterType,
            feasibleSpace: {},
          },
        ],
      });
    } else {
      // remove the parameter entry from metadata
      const paramsWithoutUnchecked = props.katibMetadata.parameters.filter(
        x => x.name !== parameterName,
      );
      props.updateKatibMetadata({
        ...props.katibMetadata,
        parameters: paramsWithoutUnchecked,
      });
    }
    // Assign the new check parameter to the pipeline parameter
    setPipelineParameters(
      pipelineParameters.map(x =>
        x[1] == parameterName ? [checked, ...x.slice(1)] : x,
      ),
    );
  };

  const updateObjective = (field: 'type' | 'goal') => (value: string) => {
    // this callback is used by the text fields and select with katib objective
    // parameters.
    // update one of the fields of the katib objective
    props.updateKatibMetadata({
      ...props.katibMetadata,
      objective: {
        ...props.katibMetadata.objective,
        [field]: field === 'goal' ? Number(value) : value,
      },
    });
  };

  const updateAlgorithmName = (value: string) => {
    props.updateKatibMetadata({
      ...props.katibMetadata,
      algorithm: { ...props.katibMetadata.algorithm, algorithmName: value },
    });
  };

  const updateAlgorithmSetting = (
    field:
      | 'random_state'
      | 'base_estimator'
      | 'n_initial_points'
      | 'acq_func'
      | 'acq_optimizer',
  ) => (value: string) => {
    let newSettings = (
      props.katibMetadata.algorithm.algorithmSettings || []
    ).filter(x => x.name !== field);
    newSettings.push({ name: field, value: value });
    props.updateKatibMetadata({
      ...props.katibMetadata,
      algorithm: {
        ...props.katibMetadata.algorithm,
        algorithmSettings: newSettings,
      },
    });
    return value;
  };

  const updateCounts = (
    field: 'maxTrialCount' | 'maxFailedTrialCount' | 'parallelTrialCount',
  ) => (value: string) => {
    props.updateKatibMetadata({
      ...props.katibMetadata,
      [field]: Number(value),
    });
  };

  const getAlgorithmSetting = (settingName: string) => {
    const setting = (
      props.katibMetadata.algorithm.algorithmSettings || []
    ).filter(x => x.name === settingName);
    return setting.length > 0 ? setting[0].value : undefined;
  };

  const getDialogHeader = (headerName: string, helpContent: any) => {
    return (
      <React.Fragment>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="center"
        >
          <div
            style={{ color: theme.kale.headers.main }}
            className="katib-dialog-header kale-header"
          >
            {headerName}
          </div>
          <LightTooltip
            title={helpContent}
            placement="top-start"
            interactive={true}
            TransitionComponent={Zoom}
          >
            <Help
              style={{ color: theme.kale.headers.main }}
              className="kale-header katib-headers-tooltip katib-dialog-header"
            />
          </LightTooltip>
        </Grid>
      </React.Fragment>
    );
  };

  const katibParameters = props.katibMetadata.parameters || [];
  const parametersControls = loading
    ? ''
    : pipelineParameters.map((parameter, idx) => {
        const [
          parameterRequired,
          parameterName,
          pyParameterType,
          parameterValue,
        ] = parameter;
        const katibParameterType = katibTypeMapper[pyParameterType];
        // check if this pipeline parameter is required or not.
        // if it is not, don't crete any input field and if it is then get the
        // metadata parameter
        const metadataParameter =
          katibParameters.filter(x => x.name === parameterName)[0] || null;
        // ignored will hide the checkbox from pipeline parameters that cannot
        // become katib parameter
        // (e.g. boolean params)
        const ignored = katibParameterType === undefined;
        const searchSpace = !parameterRequired ? (
          ''
        ) : metadataParameter.parameterType === 'categorical' ? (
          // control to add a list to a feasible space
          <Grid
            container
            direction="column"
            justify="flex-end"
            alignItems="center"
          >
            {(metadataParameter.feasibleSpace.list || []).map((value, idx) => {
              return (
                <Grid
                  container
                  direction="row"
                  justify="flex-end"
                  alignItems="center"
                >
                  <Input
                    validation={
                      pyParameterType === 'int'
                        ? 'int'
                        : pyParameterType === 'float'
                        ? 'double'
                        : null
                    }
                    variant={'outlined'}
                    label={'Value'}
                    value={value}
                    updateValue={updateParameter(
                      metadataParameter.name,
                      updateParameterFeasibleSpaceList(idx),
                    )}
                    style={{
                      marginLeft: '4px',
                      marginRight: '4px',
                      width: 'auto',
                    }}
                  />
                  <IconButton
                    aria-label="delete"
                    onClick={() => {
                      updateParameter(
                        metadataParameter.name,
                        updateParameterList('delete', idx),
                      )();
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              );
            })}
            <Grid
              container
              direction="row"
              justify="flex-end"
              alignItems="center"
            >
              <div className="add-button" style={{ padding: 0 }}>
                <Button
                  variant="contained"
                  size="small"
                  title="Add Value"
                  color="primary"
                  style={{ marginRight: '52px' }}
                  onClick={() => {
                    updateParameter(
                      metadataParameter.name,
                      updateParameterList('add', idx),
                    )();
                  }}
                >
                  <AddIcon />
                  Add Value
                </Button>
              </div>
            </Grid>
          </Grid>
        ) : metadataParameter.parameterType === 'int' ||
          metadataParameter.parameterType === 'double' ? (
          // controls to add mix max feasible space
          <Grid
            container
            direction="row"
            justify="flex-end"
            alignItems="center"
          >
            <Grid item xs={3}>
              <Input
                validation={metadataParameter.parameterType}
                variant={'outlined'}
                label={'Min'}
                value={metadataParameter.feasibleSpace.min || ''}
                updateValue={updateParameter(
                  metadataParameter.name,
                  updateParameterFeasibleSpaceRange('min'),
                )}
                style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
              />
            </Grid>

            <Grid item xs={3}>
              <Input
                validation={metadataParameter.parameterType}
                variant={'outlined'}
                label={'Max'}
                value={metadataParameter.feasibleSpace.max || ''}
                updateValue={updateParameter(
                  metadataParameter.name,
                  updateParameterFeasibleSpaceRange('max'),
                )}
                style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
              />
            </Grid>
            <Grid item xs={3}>
              <Input
                validation={metadataParameter.parameterType}
                variant={'outlined'}
                label={'Step'}
                value={metadataParameter.feasibleSpace.step || ''}
                updateValue={updateParameter(
                  metadataParameter.name,
                  updateParameterFeasibleSpaceRange('step'),
                )}
                style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
              />
            </Grid>
          </Grid>
        ) : (
          ''
        );

        return (
          <React.Fragment>
            <Grid
              container
              direction="row"
              justify="flex-start"
              alignItems="center"
            >
              <Grid item xs={1}>
                <Checkbox
                  disabled={ignored}
                  checked={parameterRequired}
                  onChange={updateParameterRequired(
                    parameterName,
                    katibParameterType,
                  )}
                  value="secondary"
                  color="primary"
                  // Here it is important to set the width to 100% because
                  // jupyter is overriding the width to auto. This makes the
                  // checkbox input to be misplaced wrt to the material checkbox
                  // and results in the onChange to not work.
                  inputProps={{
                    style: {
                      height: '100%',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <Typography
                  variant="body2"
                  style={parameterRequired ? {} : { opacity: '0.5' }}
                >
                  Name: <b>{parameterName}</b>
                </Typography>
                {katibParameterType ? (
                  <Typography
                    variant="body2"
                    style={parameterRequired ? {} : { opacity: '0.5' }}
                  >
                    Type: <b>{katibParameterType}</b>
                  </Typography>
                ) : (
                  ''
                )}
                {metadataParameter &&
                ['int', 'float'].includes(pyParameterType) ? (
                  <Select
                    variant={'outlined'}
                    updateValue={updateParameter(
                      parameterName,
                      updateNumericParameterType(
                        parameterName,
                        pyParameterType,
                      ),
                    )}
                    values={[
                      { label: 'Range', value: 'range' },
                      {
                        label: 'List',
                        value: 'list',
                        tooltip:
                          'Depending on the implementation of your chosen' +
                          ' algorithm, a list might be treated differently' +
                          ' from a range.',
                      },
                    ]}
                    value={
                      metadataParameter.parameterType === 'categorical'
                        ? 'list'
                        : 'range'
                    }
                    label={''}
                    index={0}
                  />
                ) : null}
              </Grid>
              <Grid item xs={8}>
                {katibParameterType ? (
                  searchSpace
                ) : (
                  <Typography variant="body2" style={{ opacity: '0.5' }}>
                    Katib does not support this parameter's type
                  </Typography>
                )}
              </Grid>
            </Grid>
            {/* Skip the last divider after the last parameter */}
            {/*{idx < pipelineParameters.length - 1 ? (*/}
            <Divider variant="middle" style={{ margin: '10px' }} />
            {/*) : (*/}
            {/*  ''*/}
            {/*)}*/}
          </React.Fragment>
        );
      });

  const body = loading ? (
    <React.Fragment>
      <Grid
        container
        direction="column"
        justify="center"
        alignItems="center"
        style={{ marginTop: '20px' }}
      >
        <CircularProgress />
        <Typography variant="body2">Loading pipeline parameters...</Typography>
      </Grid>
    </React.Fragment>
  ) : error !== '' ? (
    <React.Fragment>
      <Grid
        container
        direction="column"
        justify="center"
        alignItems="flex-start"
      >
        <p style={{ marginTop: '10px' }}>
          An error has occurred while parsing the notebook:
        </p>
        <p style={{ fontWeight: 700 }}>{error}</p>
      </Grid>
    </React.Fragment>
  ) : (
    <React.Fragment>
      {getDialogHeader(
        'Search Space Parameters',
        <a
          target="_blank"
          href="https://www.kubeflow.org/docs/components/hyperparameter-tuning/experiment/#configuration-spec"
        >
          More Info...
        </a>,
      )}

      {parametersControls}

      {getDialogHeader(
        'Search Algorithm',
        <a
          target="_blank"
          href="https://www.kubeflow.org/docs/components/hyperparameter-tuning/experiment/#search-algorithms"
        >
          More Info...
        </a>,
      )}

      <Select
        variant="outlined"
        label={'Algorithm'}
        values={algorithmOptions}
        value={props.katibMetadata.algorithm.algorithmName || ''}
        index={-1}
        updateValue={updateAlgorithmName}
        style={{ width: 'auto' }}
      />

      {props.katibMetadata.algorithm.algorithmName === 'random' ? (
        <React.Fragment>
          <Divider variant="middle" style={{ margin: '10px' }} />
          <Grid
            container
            direction="row"
            justify="flex-start"
            alignItems="center"
          >
            <Input
              type="number"
              variant={'outlined'}
              label={'Random State'}
              value={
                getAlgorithmSetting('random_state') ||
                updateAlgorithmSetting('random_state')('10')
              }
              updateValue={updateAlgorithmSetting('random_state')}
              style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
            />
          </Grid>
        </React.Fragment>
      ) : props.katibMetadata.algorithm.algorithmName ==
        'bayesianoptimization' ? (
        <React.Fragment>
          <Divider variant="middle" style={{ margin: '10px' }} />
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item xs={9}>
              <Select
                variant="outlined"
                label={'Base Estimator'}
                values={estimatorOptions}
                value={
                  getAlgorithmSetting('base_estimator') ||
                  updateAlgorithmSetting('base_estimator')('GP')
                }
                index={-1}
                updateValue={updateAlgorithmSetting('base_estimator')}
                style={{ width: '97%' }}
              />
            </Grid>
            <Grid item xs={3}>
              <Input
                type="number"
                variant={'outlined'}
                label={'N Initial Points'}
                value={
                  getAlgorithmSetting('random_state') ||
                  updateAlgorithmSetting('random_state')('10')
                }
                updateValue={updateAlgorithmSetting('n_initial_points')}
                style={{ marginLeft: '4px', marginRight: '4px', width: '95%' }}
              />
            </Grid>
          </Grid>
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item xs={5}>
              <Select
                variant="outlined"
                label={'Acquisition Function'}
                values={acqFuncOptions}
                value={
                  getAlgorithmSetting('acq_func') ||
                  updateAlgorithmSetting('acq_func')('gp_hedge')
                }
                index={-1}
                updateValue={updateAlgorithmSetting('acq_func')}
                style={{ width: '95%' }}
              />
            </Grid>
            <Grid item xs={4}>
              <Input
                variant={'outlined'}
                label={'Acq. Fun. Optimizer'}
                value={
                  getAlgorithmSetting('acq_optimizer') ||
                  updateAlgorithmSetting('acq_optimizer')('auto')
                }
                updateValue={updateAlgorithmSetting('acq_optimizer')}
                style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
              />
            </Grid>
            <Grid item xs={3}>
              <Input
                type="number"
                variant={'outlined'}
                label={'Random State'}
                value={
                  getAlgorithmSetting('random_state') ||
                  updateAlgorithmSetting('random_state')('10')
                }
                updateValue={updateAlgorithmSetting('random_state')}
                style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
              />
            </Grid>
          </Grid>
        </React.Fragment>
      ) : (
        ''
      )}

      {getDialogHeader(
        'Search Objective',
        <a
          target="_blank"
          href="https://www.kubeflow.org/docs/components/hyperparameter-tuning/experiment/#configuration-spec"
        >
          More Info...
        </a>,
      )}

      <Grid container direction="row" justify="center" alignItems="center">
        <Grid item xs={4}>
          <Select
            variant="outlined"
            label={'Reference Metric'}
            values={pipelineMetrics}
            value={props.katibMetadata.objective.objectiveMetricName || ''}
            index={-1}
            updateValue={updateObjectiveMetricName}
            style={{ width: '95%' }}
          />
        </Grid>
        <Grid item xs={4}>
          <Select
            variant="outlined"
            label={'Type'}
            values={[
              { label: 'Minimize', value: 'minimize' },
              { label: 'Maximize', value: 'maximize' },
            ]}
            value={props.katibMetadata.objective.type || 'minimize'}
            index={-1}
            updateValue={updateObjective('type')}
            style={{ width: '95%' }}
          />
        </Grid>
        <Grid item xs={4}>
          <Input
            validation="double"
            variant={'outlined'}
            label={'Goal'}
            value={props.katibMetadata.objective.goal || ''}
            updateValue={updateObjective('goal')}
            style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
          />
        </Grid>
      </Grid>

      {getDialogHeader(
        'Run Parameters',
        <a
          target="_blank"
          href="https://www.kubeflow.org/docs/components/hyperparameter-tuning/experiment/#configuration-spec"
        >
          More Info...
        </a>,
      )}

      <Grid container direction="row" justify="center" alignItems="center">
        <Grid item xs={4}>
          <Input
            validation="int"
            variant={'outlined'}
            label={'Parallel Trial Count'}
            value={props.katibMetadata.parallelTrialCount}
            updateValue={updateCounts('parallelTrialCount')}
            style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
          />
        </Grid>
        <Grid item xs={4}>
          <Input
            validation="int"
            variant={'outlined'}
            label={'Max Trial Count'}
            value={props.katibMetadata.maxTrialCount}
            updateValue={updateCounts('maxTrialCount')}
            style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
          />
        </Grid>
        <Grid item xs={4}>
          <Input
            validation="int"
            variant={'outlined'}
            label={'max Failed Trial Count'}
            value={props.katibMetadata.maxFailedTrialCount}
            updateValue={updateCounts('maxFailedTrialCount')}
            style={{ marginLeft: '4px', marginRight: '4px', width: 'auto' }}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      fullWidth={true}
      maxWidth={'sm'}
      scroll="paper"
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title">
        <p
          style={{ padding: '0', color: theme.kale.headers.main }}
          className="kale-header"
        >
          Katib Job
        </p>
      </DialogTitle>
      <DialogContent dividers={true} style={{ paddingTop: 0 }}>
        {body}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
