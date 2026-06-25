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
import { useCallback, useContext, useRef, useState } from 'react';
import { NotebookPanel } from '@jupyterlab/notebook';
import TagsUtils from '../../lib/TagsUtils';
import CloseIcon from '@mui/icons-material/Close';
import ColorUtils from '../../lib/ColorUtils';
import { CellMetadataContext } from '../../lib/CellMetadataContext';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { SelectMulti } from '../../components/SelectMulti';
import { GpuDialog } from './dialogs/GpuDialog';
import { BaseImageDialog } from './dialogs/BaseImageDialog';
import { CacheDialog } from './dialogs/CacheDialog';
import { useUpdateCellTags } from './hooks/useCellTags';
import { useEditorPosition } from './hooks/useEditorPosition';
import {
  CELL_TYPES,
  RESERVED_CELL_NAMES,
  STEP_NAME_ERROR_MSG,
} from './constants';

export {
  RESERVED_CELL_NAMES,
  RESERVED_CELL_NAMES_HELP_TEXT,
  RESERVED_CELL_NAMES_CHIP_COLOR,
} from './constants';

export interface ICellEditorData {
  notebook: NotebookPanel;
  stepName?: string;
  stepDependencies: string[];
  limits?: { [id: string]: string };
  baseImage?: string;
  enableCaching?: boolean;
}

export interface IProps extends ICellEditorData {
  resolvedDefaultBaseImage: string;
}

export const CellMetadataEditor: React.FC<IProps> = props => {
  const {
    notebook,
    stepName = '',
    stepDependencies,
    limits = {},
    baseImage,
    enableCaching,
    resolvedDefaultBaseImage,
  } = props;

  const { activeCellIndex, isEditorVisible, onEditorVisibilityChange } =
    useContext(CellMetadataContext);

  const editorRef = useRef<HTMLDivElement>(null);

  const updateCellTags = useUpdateCellTags({
    notebook,
    stepName,
    stepDependencies,
    limits,
    baseImage,
    enableCaching,
  });

  useEditorPosition(editorRef, notebook);

  const stepDependenciesChoices = React.useMemo(() => {
    if (!notebook) {
      return [];
    }
    const allSteps = TagsUtils.getAllSteps(notebook.content, activeCellIndex);
    return allSteps
      .filter(el => !RESERVED_CELL_NAMES.includes(el) && el !== stepName)
      .map(name => ({ value: name, color: `#${ColorUtils.getColor(name)}` }));
  }, [notebook, stepName, stepDependencies, activeCellIndex]);

  const previousStepName = React.useMemo(
    () =>
      notebook
        ? TagsUtils.getPreviousStep(notebook.content, activeCellIndex)
        : undefined,
    [notebook, activeCellIndex, stepName],
  );

  const cellType = RESERVED_CELL_NAMES.includes(stepName) ? stepName : 'step';
  const cellColor = stepName
    ? `#${ColorUtils.getColor(stepName)}`
    : 'transparent';
  const isStep = cellType === 'step';
  const hasStepName = !!(stepName && stepName.length > 0);

  const prevStepNotice =
    previousStepName && stepName === ''
      ? `Leave the step name empty to merge the cell to step '${previousStepName}'`
      : null;

  const [stepNameErrorMsg, setStepNameErrorMsg] = useState(STEP_NAME_ERROR_MSG);

  const onBeforeUpdate = useCallback(
    (value: string) => {
      if (value === stepName) {
        return false;
      }
      const stepNames = TagsUtils.getAllSteps(notebook.content);
      if (stepNames.includes(value)) {
        setStepNameErrorMsg('This name already exists.');
        return true;
      }
      setStepNameErrorMsg(STEP_NAME_ERROR_MSG);
      return false;
    },
    [notebook, stepName],
  );

  const [gpuDialogOpen, setGpuDialogOpen] = useState(false);
  const [baseImageDialogOpen, setBaseImageDialogOpen] = useState(false);
  const [cacheDialogOpen, setCacheDialogOpen] = useState(false);

  const closeEditor = useCallback(() => {
    onEditorVisibilityChange(false);
  }, [onEditorVisibilityChange]);

  return (
    <>
      <div>
        <div
          className={
            'kale-metadata-editor-wrapper' +
            (isEditorVisible ? ' opened' : '') +
            (isStep ? ' kale-is-step' : '')
          }
          ref={editorRef}
        >
          <div
            className={
              'kale-cell-metadata-editor' + (isEditorVisible ? '' : ' hidden')
            }
            style={{ borderLeft: `2px solid ${cellColor}` }}
          >
            <Select
              updateValue={updateCellTags.updateCellType}
              values={CELL_TYPES}
              value={cellType || 'step'}
              label={'Cell type'}
              index={0}
              variant="outlined"
              style={{ width: '30%' }}
            />

            {isStep && (
              <>
                <Input
                  label={'Step name'}
                  updateValue={updateCellTags.updateStepName}
                  value={stepName}
                  regex={'^([_a-z]([_a-z0-9]*)?)?$'}
                  regexErrorMsg={stepNameErrorMsg}
                  variant="outlined"
                  onBeforeUpdate={onBeforeUpdate}
                  style={{ width: '30%' }}
                />

                <Tooltip
                  title={
                    !hasStepName
                      ? 'Please enter a step name first'
                      : stepDependenciesChoices.length === 0
                        ? 'No other steps available. Add more pipeline steps to create dependencies.'
                        : 'Select which steps this step depends on'
                  }
                  placement="top"
                  arrow
                >
                  <div style={{ width: '30%', marginRight: '4px' }}>
                    <SelectMulti
                      id="select-previous-steps"
                      label="Depends on"
                      disabled={
                        !hasStepName || stepDependenciesChoices.length === 0
                      }
                      updateSelected={updateCellTags.updateDependencies}
                      options={stepDependenciesChoices}
                      variant="outlined"
                      selected={stepDependencies || []}
                    />
                  </div>
                </Tooltip>

                <div style={{ padding: 0, marginRight: '4px' }}>
                  <Button
                    disabled={!hasStepName}
                    color="primary"
                    variant="contained"
                    size="small"
                    title="Base Image"
                    onClick={() => setBaseImageDialogOpen(true)}
                    style={{ width: '5%' }}
                  >
                    IMAGE
                  </Button>
                </div>

                <div style={{ padding: 0, marginRight: '4px' }}>
                  <Button
                    disabled={!hasStepName}
                    color="primary"
                    variant="contained"
                    size="small"
                    title="GPU"
                    onClick={() => setGpuDialogOpen(true)}
                    style={{ width: '5%' }}
                  >
                    GPU
                  </Button>
                </div>

                <div style={{ padding: 0 }}>
                  <Button
                    disabled={!hasStepName}
                    color="primary"
                    variant="contained"
                    size="small"
                    title="Caching"
                    onClick={() => setCacheDialogOpen(true)}
                    style={{ width: '5%' }}
                  >
                    CACHE
                  </Button>
                </div>
              </>
            )}

            <IconButton aria-label="delete" onMouseDown={closeEditor}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <div
            className={
              'kale-cell-metadata-editor-helper-text' +
              (isEditorVisible ? '' : ' hidden')
            }
          >
            <p>{prevStepNotice}</p>
          </div>
        </div>
      </div>

      <GpuDialog
        open={gpuDialogOpen}
        toggleDialog={() => setGpuDialogOpen(prev => !prev)}
        stepName={stepName}
        limits={limits}
        updateLimits={updateCellTags.updateLimits}
      />

      <BaseImageDialog
        open={baseImageDialogOpen}
        onClose={() => setBaseImageDialogOpen(false)}
        baseImage={baseImage}
        resolvedDefaultBaseImage={resolvedDefaultBaseImage}
        onUpdateBaseImage={updateCellTags.updateBaseImage}
      />

      <CacheDialog
        open={cacheDialogOpen}
        onClose={() => setCacheDialogOpen(false)}
        enableCaching={enableCaching}
        onUpdateCaching={updateCellTags.updateCaching}
      />
    </>
  );
};
