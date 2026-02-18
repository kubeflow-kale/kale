// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as React from 'react';
import { NotebookPanel } from '@jupyterlab/notebook';
import TagsUtils from '../../lib/TagsUtils';
import { isCodeCellModel } from '@jupyterlab/cells';
import CloseIcon from '@mui/icons-material/Close';
import ColorUtils from '../../lib/ColorUtils';
import { CellMetadataContext } from '../../lib/CellMetadataContext';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { CellMetadataEditorDialog } from './CellMetadataEditorDialog';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { SelectMulti } from '../../components/SelectMulti';

const CELL_TYPES = [
  { value: 'imports', label: 'Imports' },
  { value: 'functions', label: 'Functions' },
  { value: 'pipeline-parameters', label: 'Pipeline Parameters' },
  { value: 'pipeline-metrics', label: 'Pipeline Metrics' },
  { value: 'step', label: 'Pipeline Step' },
  { value: 'skip', label: 'Skip Cell' },
];

export const RESERVED_CELL_NAMES = [
  'imports',
  'functions',
  'pipeline-parameters',
  'pipeline-metrics',
  'skip',
];

export const RESERVED_CELL_NAMES_HELP_TEXT: { [id: string]: string } = {
  imports:
    'The code in this cell will be pre-pended to every step of the pipeline.',
  functions:
    'The code in this cell will be pre-pended to every step of the pipeline,' +
    ' after `imports`.',
  'pipeline-parameters':
    'The variables in this cell will be transformed into pipeline parameters,' +
    ' preserving the current values as defaults.',
  'pipeline-metrics':
    'The variables in this cell will be transformed into pipeline metrics.',
  skip: 'This cell will be skipped and excluded from pipeline steps',
};
export const RESERVED_CELL_NAMES_CHIP_COLOR: { [id: string]: string } = {
  skip: 'a9a9a9',
  'pipeline-parameters': 'ee7a1a',
  'pipeline-metrics': '773d0d',
  imports: 'a32626',
  functions: 'a32626',
};

export const DEFAULT_BASE_IMAGE = 'python:3.12';

const STEP_NAME_ERROR_MSG = `Step name must consist of lower case alphanumeric
 characters or '_', and can not start with a digit.`;

export interface IProps {
  notebook: NotebookPanel;
  stepName?: string;
  stepDependencies: string[];
  // Resource limits, like gpu limits
  limits?: { [id: string]: string };
  // Base image for this step
  baseImage?: string;
  pipelineBaseImage?: string;
  defaultBaseImage?: string;
}

// this stores the name of a block and its color (form the name hash)
type BlockDependencyChoice = { value: string; color: string };
interface IState {
  // used to store the closest preceding block name. Used in case the current
  // block name is empty, to suggest merging to the previous one.
  previousStepName?: string;
  stepNameErrorMsg?: string;
  // a list of blocks that the current step can be dependent on.
  blockDependenciesChoices: BlockDependencyChoice[];
  // flag to open the metadata editor dialog dialog
  // XXX (stefano): I would like to set this as required, but the return
  // XXX (stefano): statement of updateBlockDependenciesChoices and
  // XXX (stefano): updatePreviousStepName don't allow me.
  cellMetadataEditorDialog: boolean;
  baseImageDialogOpen: boolean;
}

const DefaultState: IState = {
  previousStepName: undefined,
  stepNameErrorMsg: STEP_NAME_ERROR_MSG,
  blockDependenciesChoices: [],
  cellMetadataEditorDialog: false,
  baseImageDialogOpen: false,
};

/**
 * Component that allow to edit the Kale cell tags of a notebook cell.
 */
export class CellMetadataEditor extends React.Component<IProps, IState> {
  static contextType = CellMetadataContext;
  context!: React.ContextType<typeof CellMetadataContext>;
  editorRef: React.RefObject<HTMLDivElement>;

  constructor(props: IProps) {
    super(props);
    // We use this element reference in order to move it inside Notebooks's cell
    // element.
    this.editorRef = React.createRef();
    this.state = DefaultState;
    this.updateCurrentBlockName = this.updateCurrentBlockName.bind(this);
    this.updateCurrentCellType = this.updateCurrentCellType.bind(this);
    this.updatePrevBlocksNames = this.updatePrevBlocksNames.bind(this);
    this.toggleTagsEditorDialog = this.toggleTagsEditorDialog.bind(this);
    this.toggleBaseImageDialog = this.toggleBaseImageDialog.bind(this);
  }

  componentWillUnmount() {
    const editor = this.editorRef.current;
    if (editor) {
      editor.remove();
    }
  }

  updateCurrentCellType = (value: string) => {
    if (RESERVED_CELL_NAMES.includes(value)) {
      this.updateCurrentBlockName(value);
    } else {
      TagsUtils.resetCell(
        this.props.notebook,
        this.context.activeCellIndex,
        this.props.stepName || '',
      );
    }
  };

  isEqual(a: BlockDependencyChoice[], b: BlockDependencyChoice[]): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * When the activeCellIndex of the editor changes, the editor needs to be
   * moved to the correct position.
   */
  moveEditor() {
    if (!this.props.notebook) {
      return;
    }
    // get the HTML element corresponding to the current active cell
    const notebookContent = this.props.notebook.content;
    if (!notebookContent?.node?.childNodes) {
      return;
    }
    const metadataWrapper = this.props.notebook.content.widgets[
      this.context.activeCellIndex
    ].node as HTMLElement;

    if (!metadataWrapper) {
      return;
    }
    const editor = this.editorRef.current;
    const inlineElement = metadataWrapper.querySelector(
      '.kale-inline-cell-metadata-container',
    );
    const isEditorAlreadInPlace = metadataWrapper.querySelector(
      '.kale-metadata-editor-wrapper',
    );

    if (editor && inlineElement && !isEditorAlreadInPlace) {
      editor.remove();
      metadataWrapper.prepend(editor);
    }
  }

  componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>) {
    this.hideEditorIfNotCodeCell();
    this.moveEditor();
    // this.setState(this.updateBlockDependenciesChoices);
    // this.setState(this.updatePreviousStepName);
    const dependenciesState = this.updateBlockDependenciesChoices(
      this.state,
      this.props,
    );
    if (dependenciesState) {
      this.setState(dependenciesState);
    }

    const previousStepState = this.updatePreviousStepName(
      this.state,
      this.props,
    );
    if (previousStepState) {
      this.setState(previousStepState);
    }
  }

  hideEditorIfNotCodeCell() {
    if (
      this.props.notebook &&
      !this.props.notebook.isDisposed &&
      this.props.notebook.model
    ) {
      const cellModel = this.props.notebook.model.cells.get(
        this.context.activeCellIndex,
      );
      if (
        cellModel &&
        !isCodeCellModel(cellModel) &&
        this.context.isEditorVisible
      ) {
        this.closeEditor();
      }
    }
  }

  /**
   * Scan the notebook for all block tags and get them all, excluded the current
   * one (and the reserved cell tags) The value `previousBlockChoices` is used
   * by the dependencies select option to select the current step's
   * dependencies.
   */
  updateBlockDependenciesChoices(
    state: Readonly<IState>,
    props: Readonly<IProps>,
  ): Pick<IState, 'blockDependenciesChoices'> | null {
    if (!props.notebook) {
      return null;
    }
    const allBlocks = TagsUtils.getAllBlocks(props.notebook.content);
    const dependencyChoices: BlockDependencyChoice[] = allBlocks
      // remove all reserved names and current step name
      .filter(
        el => !RESERVED_CELL_NAMES.includes(el) && !(el === props.stepName),
      )
      .map(name => ({ value: name, color: `#${ColorUtils.getColor(name)}` }));

    if (this.isEqual(state.blockDependenciesChoices, dependencyChoices)) {
      return null;
    }
    // XXX (stefano): By setting state.cellMetadataEditorDialog NOT optional,
    // XXX (stefano): this return will require cellMetadataEditorDialog.
    return { blockDependenciesChoices: dependencyChoices };
  }

  updatePreviousStepName(
    state: Readonly<IState>,
    props: Readonly<IProps>,
  ): Pick<IState, 'previousStepName'> | null {
    if (!props.notebook) {
      return null;
    }
    const prevBlockName = TagsUtils.getPreviousBlock(
      props.notebook.content,
      this.context.activeCellIndex,
    );
    if (prevBlockName === this.state.previousStepName) {
      return null;
    }
    // XXX (stefano): By setting state.cellMetadataEditorDialog NOT optional,
    // XXX (stefano): this return will require cellMetadataEditorDialog.
    return { previousStepName: prevBlockName };
  }

  updateCurrentBlockName = (value: string) => {
    const oldBlockName: string = this.props.stepName || '';
    const currentCellMetadata = {
      prevBlockNames: this.props.stepDependencies,
      limits: this.props.limits || {},
      baseImage: this.props.baseImage,
      blockName: value,
    };

    TagsUtils.setKaleCellTags(
      this.props.notebook,
      this.context.activeCellIndex,
      currentCellMetadata,
      false,
    ).then(() => {
      TagsUtils.updateKaleCellsTags(this.props.notebook, oldBlockName, value);
    });
  };

  /**
   * Even handler of the MultiSelect used to select the dependencies of a block
   */
  updatePrevBlocksNames = (previousBlocks: string[]) => {
    const currentCellMetadata = {
      blockName: this.props.stepName || '',
      limits: this.props.limits || {},
      baseImage: this.props.baseImage,
      prevBlockNames: previousBlocks,
    };

    TagsUtils.setKaleCellTags(
      this.props.notebook,
      this.context.activeCellIndex,
      currentCellMetadata,
      true,
    );
  };

  /**
   * Event triggered when the the CellMetadataEditorDialog dialog is closed
   */
  updateCurrentLimits = (
    actions: {
      action: 'update' | 'delete';
      limitKey: string;
      limitValue?: string;
    }[],
  ) => {
    const limits = { ...this.props.limits };
    actions.forEach(action => {
      if (action.action === 'update' && action.limitValue !== undefined) {
        limits[action.limitKey] = action.limitValue;
      }
      if (
        action.action === 'delete' &&
        Object.keys(this.props.limits || {}).includes(action.limitKey)
      ) {
        delete limits[action.limitKey];
      }
    });

    const currentCellMetadata = {
      blockName: this.props.stepName || '',
      prevBlockNames: this.props.stepDependencies,
      limits: limits,
      baseImage: this.props.baseImage,
    };

    TagsUtils.setKaleCellTags(
      this.props.notebook,
      this.context.activeCellIndex,
      currentCellMetadata,
      true,
    );
  };

  /**
   * Function called before updating the value of the block name input text
   * field. It acts as a validator.
   */
  onBeforeUpdate = (value: string) => {
    if (value === this.props.stepName) {
      return false;
    }
    const blockNames = TagsUtils.getAllBlocks(this.props.notebook.content);
    if (blockNames.includes(value)) {
      this.setState({ stepNameErrorMsg: 'This name already exists.' });
      return true;
    }
    this.setState({ stepNameErrorMsg: STEP_NAME_ERROR_MSG });
    return false;
  };

  getPrevStepNotice = () => {
    return this.state.previousStepName && this.props.stepName === ''
      ? `Leave the step name empty to merge the cell to step '${this.state.previousStepName}'`
      : null;
  };

  /**
   * Event handler of close button, positioned on the top right of the cell
   */
  closeEditor() {
    this.context.onEditorVisibilityChange(false);
  }

  toggleTagsEditorDialog() {
    this.setState({
      cellMetadataEditorDialog: !this.state.cellMetadataEditorDialog,
    });
  }

  toggleBaseImageDialog() {
    this.setState({
      baseImageDialogOpen: !this.state.baseImageDialogOpen,
    });
  }

  updateBaseImage = (value: string) => {
    const currentCellMetadata = {
      blockName: this.props.stepName || '',
      prevBlockNames: this.props.stepDependencies,
      limits: this.props.limits || {},
      baseImage: value || undefined,
    };

    TagsUtils.setKaleCellTags(
      this.props.notebook,
      this.context.activeCellIndex,
      currentCellMetadata,
      true,
    );
  };

  render() {
    const cellType = RESERVED_CELL_NAMES.includes(this.props.stepName || '')
      ? this.props.stepName
      : 'step';
    const cellColor = this.props.stepName
      ? `#${ColorUtils.getColor(this.props.stepName)}`
      : 'transparent';

    const prevStepNotice = this.getPrevStepNotice();

    return (
      <React.Fragment>
        <div>
          <div
            className={
              'kale-metadata-editor-wrapper' +
              (this.context.isEditorVisible ? ' opened' : '') +
              (cellType === 'step' ? ' kale-is-step' : '')
            }
            ref={this.editorRef}
          >
            <div
              className={
                'kale-cell-metadata-editor' +
                (this.context.isEditorVisible ? '' : ' hidden')
              }
              style={{ borderLeft: `2px solid ${cellColor}` }}
            >
              <Select
                updateValue={this.updateCurrentCellType}
                values={CELL_TYPES}
                value={cellType || 'step'}
                label={'Cell type'}
                index={0}
                variant="outlined"
                style={{ width: '30%' }}
              />

              {cellType === 'step' ? (
                <Input
                  label={'Step name'}
                  updateValue={this.updateCurrentBlockName}
                  value={this.props.stepName || ''}
                  regex={'^([_a-z]([_a-z0-9]*)?)?$'}
                  regexErrorMsg={this.state.stepNameErrorMsg}
                  variant="outlined"
                  onBeforeUpdate={this.onBeforeUpdate}
                  style={{ width: '30%' }}
                />
              ) : (
                ''
              )}
              {cellType === 'step' ? (
                <Tooltip
                  title={
                    !this.props.stepName || this.props.stepName.length === 0
                      ? 'Please enter a step name first'
                      : this.state.blockDependenciesChoices.length === 0
                        ? 'No other steps available. Add more pipeline steps to create dependencies.'
                        : 'Select which steps this step depends on'
                  }
                  placement="top"
                  arrow
                >
                  <div
                    style={{
                      width: '30%',
                      marginRight: '4px',
                    }}
                  >
                    <SelectMulti
                      id="select-previous-blocks"
                      label="Depends on"
                      disabled={
                        !(
                          this.props.stepName && this.props.stepName.length > 0
                        ) || this.state.blockDependenciesChoices.length === 0
                      }
                      updateSelected={this.updatePrevBlocksNames}
                      options={this.state.blockDependenciesChoices}
                      variant="outlined"
                      selected={this.props.stepDependencies || []}
                    />
                  </div>
                </Tooltip>
              ) : (
                ''
              )}

              {cellType === 'step' ? (
                <div style={{ padding: 0, marginRight: '4px' }}>
                  <Button
                    disabled={
                      !(this.props.stepName && this.props.stepName.length > 0)
                    }
                    color="primary"
                    variant="contained"
                    size="small"
                    title="Base Image"
                    onClick={() => this.toggleBaseImageDialog()}
                    style={{ width: '5%' }}
                  >
                    IMAGE
                  </Button>
                </div>
              ) : (
                ''
              )}

              {cellType === 'step' ? (
                <div style={{ padding: 0 }}>
                  <Button
                    disabled={
                      !(this.props.stepName && this.props.stepName.length > 0)
                    }
                    color="primary"
                    variant="contained"
                    size="small"
                    title="GPU"
                    onClick={() => this.toggleTagsEditorDialog()}
                    style={{ width: '5%' }}
                  >
                    GPU
                  </Button>
                </div>
              ) : (
                ''
              )}

              <IconButton
                aria-label="delete"
                onClick={() => this.closeEditor()}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <div
              className={
                'kale-cell-metadata-editor-helper-text' +
                (this.context.isEditorVisible ? '' : ' hidden')
              }
            >
              <p>{prevStepNotice}</p>
            </div>
          </div>
        </div>
        <CellMetadataEditorDialog
          open={this.state.cellMetadataEditorDialog}
          toggleDialog={this.toggleTagsEditorDialog}
          stepName={this.props.stepName || ''}
          limits={this.props.limits || {}}
          updateLimits={this.updateCurrentLimits}
        />
        <Dialog
          open={this.state.baseImageDialogOpen}
          onClose={() => this.toggleBaseImageDialog()}
          fullWidth={true}
          maxWidth={'sm'}
        >
          <DialogTitle>Base Image for Step</DialogTitle>
          <DialogContent>
            <p style={{ margin: '8px 0' }}>
              Default:{' '}
              <strong>
                {this.props.defaultBaseImage || DEFAULT_BASE_IMAGE}
              </strong>
            </p>
            <Input
              variant="outlined"
              label="Custom Base Image"
              value={this.props.baseImage || ''}
              updateValue={(v: string) => this.updateBaseImage(v)}
              placeholder={
                this.props.pipelineBaseImage ||
                this.props.defaultBaseImage ||
                DEFAULT_BASE_IMAGE
              }
              style={{ width: '100%', marginTop: '8px' }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                this.updateBaseImage('');
                this.toggleBaseImageDialog();
              }}
              color="secondary"
            >
              Reset to Default
            </Button>
            <Button
              onClick={() => this.toggleBaseImageDialog()}
              color="primary"
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    );
  }
}
