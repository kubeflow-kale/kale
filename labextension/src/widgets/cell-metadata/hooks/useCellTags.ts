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

import { useCallback, useContext } from 'react';
import { NotebookPanel } from '@jupyterlab/notebook';
import TagsUtils from '../../../lib/TagsUtils';
import { CellMetadataContext } from '../../../lib/CellMetadataContext';
import { RESERVED_CELL_NAMES } from '../constants';

interface IUseCellTagsParams {
  notebook: NotebookPanel;
  stepName?: string;
  stepDependencies: string[];
  limits?: { [id: string]: string };
  baseImage?: string;
  enableCaching?: boolean;
}

/**
 * Hook that encapsulates all Kale cell metadata write operations.
 * Each returned function reads the current tags, merges the change,
 * and writes back via TagsUtils.
 */
export function useUpdateCellTags({
  notebook,
  stepName,
  stepDependencies,
  limits,
  baseImage,
  enableCaching,
}: IUseCellTagsParams) {
  const { activeCellIndex } = useContext(CellMetadataContext);

  const updateStepName = useCallback(
    (value: string) => {
      const oldStepName = stepName || '';
      TagsUtils.setKaleCellTags(notebook, activeCellIndex, {
        prevStepNames: stepDependencies,
        limits: limits || {},
        baseImage,
        enableCaching,
        stepName: value,
      }).then(() => {
        TagsUtils.updateKaleCellsTags(notebook, oldStepName, value);
      });
    },
    [
      notebook,
      activeCellIndex,
      stepName,
      stepDependencies,
      limits,
      baseImage,
      enableCaching,
    ],
  );

  const updateCellType = useCallback(
    (value: string) => {
      if (RESERVED_CELL_NAMES.includes(value)) {
        updateStepName(value);
      } else {
        TagsUtils.resetCell(notebook, activeCellIndex, stepName || '');
      }
    },
    [notebook, activeCellIndex, stepName, updateStepName],
  );

  const updateDependencies = useCallback(
    (previousSteps: string[]) => {
      TagsUtils.setKaleCellTags(notebook, activeCellIndex, {
        stepName: stepName || '',
        limits: limits || {},
        baseImage,
        enableCaching,
        prevStepNames: previousSteps,
      });
    },
    [notebook, activeCellIndex, stepName, limits, baseImage, enableCaching],
  );

  const updateLimits = useCallback(
    (
      actions: {
        action: 'update' | 'delete';
        limitKey: string;
        limitValue?: string;
      }[],
    ) => {
      const newLimits = { ...limits };
      actions.forEach(a => {
        if (a.action === 'update' && a.limitValue !== undefined) {
          newLimits[a.limitKey] = a.limitValue;
        }
        if (
          a.action === 'delete' &&
          Object.keys(limits || {}).includes(a.limitKey)
        ) {
          delete newLimits[a.limitKey];
        }
      });

      TagsUtils.setKaleCellTags(notebook, activeCellIndex, {
        stepName: stepName || '',
        prevStepNames: stepDependencies,
        limits: newLimits,
        baseImage,
        enableCaching,
      });
    },
    [
      notebook,
      activeCellIndex,
      stepName,
      stepDependencies,
      limits,
      baseImage,
      enableCaching,
    ],
  );

  const updateBaseImage = useCallback(
    (value: string) => {
      TagsUtils.setKaleCellTags(notebook, activeCellIndex, {
        stepName: stepName || '',
        prevStepNames: stepDependencies,
        limits: limits || {},
        baseImage: value || undefined,
        enableCaching,
      });
    },
    [
      notebook,
      activeCellIndex,
      stepName,
      stepDependencies,
      limits,
      enableCaching,
    ],
  );

  const updateCaching = useCallback(
    (value: boolean | undefined) => {
      TagsUtils.setKaleCellTags(notebook, activeCellIndex, {
        stepName: stepName || '',
        prevStepNames: stepDependencies,
        limits: limits || {},
        baseImage,
        enableCaching: value,
      });
    },
    [notebook, activeCellIndex, stepName, stepDependencies, limits, baseImage],
  );

  return {
    updateCellType,
    updateStepName,
    updateDependencies,
    updateLimits,
    updateBaseImage,
    updateCaching,
  };
}
