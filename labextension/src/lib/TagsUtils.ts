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

import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import CellUtils from './CellUtils';
import { RESERVED_CELL_NAMES } from '../widgets/cell-metadata/CellMetadataEditor';

const IMAGE_TAG = 'image:';
const CACHE_TAG = 'cache:';
const CACHE_ENABLED_VALUE = 'enabled';

interface IKaleCellTags {
  stepName: string;
  prevStepNames: string[];
  limits?: { [id: string]: string };
  baseImage?: string;
  enableCaching?: boolean;
}

/** Contains utility functions for manipulating/handling Kale cell tags. */
export default class TagsUtils {
  /**
   * Get all the `step:<name>` tags in the notebook.
   * @param notebook Notebook object
   * @returns Array<str> - a list of the pipeline step names
   */
  public static getAllSteps(notebook: Notebook, cellIndex: number = -1): string[] {
    if (!notebook.model) {
      return [];
    }
    const steps = new Set<string>();
    const toCell = cellIndex < 0 ? notebook.model.cells.length : cellIndex;
    // iterate through the notebook cells
    for (const idx of Array(toCell).keys()) {
      // get the tags of the current cell
      const mt = this.getKaleCellTags(notebook, idx);
      if (mt && mt.stepName && mt.stepName !== '') {
        steps.add(mt.stepName);
      }
    }
    return Array.from(steps);
  }

  /**
   * Given a notebook cell index, get the closest previous cell that has a Kale
   * tag
   * @param notebook The notebook object
   * @param current The index of the cell to start the search from
   * @returns string - Name of the `step` tag of the closest previous cell
   */
  public static getPreviousStep(notebook: Notebook, current: number): string | undefined {
    for (let i = current - 1; i >= 0; i--) {
      const mt = this.getKaleCellTags(notebook, i);
      if (
        mt &&
        mt.stepName &&
        mt.stepName !== 'skip' &&
        mt.stepName !== ''
      ) {
        return mt.stepName;
      }
    }
    return undefined;
  }

  /**
   * Parse a notebook cell's metadata and return all the Kale tags
   * @param notebook Notebook object
   * @param index The index of the notebook cell
   * @returns IKaleCellTags: an object containing all the cell's Kale tags
   */
  public static getKaleCellTags(
    notebook: Notebook,
    index: number,
  ): IKaleCellTags | null {
    const tags: string[] = CellUtils.getCellMetaData(notebook, index, 'tags') || [];
    if (tags) {
      const b_name = tags.map(v => {
        if (RESERVED_CELL_NAMES.includes(v)) {
          return v;
        }
        if (v.startsWith('step:')) {
          return v.replace('step:', '');
        }
      }).filter(v => v !== undefined);

      const prevs = tags
        .filter(v => {
          return v.startsWith('prev:');
        })
        .map(v => {
          return v.replace('prev:', '');
        });

      const limits: { [id: string]: string } = {};
      tags
        .filter(v => v.startsWith('limit:'))
        .map(lim => {
          const values = lim.split(':');
          // get the limit key and value
          limits[values[1]] = values[2];
        });

      // Parse base image tag
      let baseImage: string | undefined;
      const imageTag = tags.find(v => v.startsWith(IMAGE_TAG));
      if (imageTag) {
        // Remove 'image:' prefix to get the full image string
        baseImage = imageTag.substring(IMAGE_TAG.length);
      }

      // Parse cache tag
      let enableCaching: boolean | undefined;
      const cacheTag = tags.find(v => v.startsWith(CACHE_TAG));
      if (cacheTag) {
        const cacheValue = cacheTag.substring(CACHE_TAG.length);
        enableCaching = cacheValue === CACHE_ENABLED_VALUE ? true : false;
      }

      return {
        stepName: b_name[0] || '',
        prevStepNames: prevs,
        limits: limits,
        baseImage: baseImage,
        enableCaching: enableCaching,
      };
    }
    return null;
  }

  /**
   * Set the provided Kale metadata into the specified notebook cell
   * @param notebookPanel NotebookPanel object
   * @param index index of the target cell
   * @param metadata Kale metadata
   * @param save True to save the notebook after the operation
   */
  public static setKaleCellTags(
    notebookPanel: NotebookPanel,
    index: number,
    metadata: IKaleCellTags
  ): Promise<any> {
    // make the dict to save to tags
    let nb = metadata.stepName;
    // not a reserved name
    if (!RESERVED_CELL_NAMES.includes(metadata.stepName)) {
      nb = 'step:' + nb;
    }
    const stepDependencies = metadata.prevStepNames || [];
    const limits = metadata.limits || {};
    const baseImage = metadata.baseImage;
    const tags = [nb]
      .concat(stepDependencies.map(v => 'prev:' + v))
      .concat(
        Object.keys(limits).map(lim => 'limit:' + lim + ':' + limits[lim]),
      );

    // Add base image tag if specified
    if (baseImage) {
      tags.push(IMAGE_TAG + baseImage);
    }

    // Add cache tag if specified
    if (metadata.enableCaching !== undefined) {
      tags.push(CACHE_TAG + (metadata.enableCaching ? 'enabled' : 'disabled'));
    }

    return CellUtils.setCellMetaData(notebookPanel, index, 'tags', tags);
  }

  /**
   * Parse the entire notebook cells to change a step name. This happens when
   * the step name of a cell is changed by the user, using Kale's inline tag
   * editor. We need to parse the entire notebook because all the `prev` dependencies
   * specified in the cells must be bound to the new name.
   * @param notebookPanel NotebookPanel object
   * @param oldStepName previous step name
   * @param newStepName new step name
   */
  public static updateKaleCellsTags(
    notebookPanel: NotebookPanel,
    oldStepName: string,
    newStepName: string,
  ) {
    let i: number;
    const allPromises = [];
    for (i = 0; i < notebookPanel.model!.cells.length; i++) {
      const tags: string[] = CellUtils.getCellMetaData(
        notebookPanel.content,
        i,
        'tags',
      ) || [];
      // If there is a prev tag that points to the old name, update it with the
      // new one.
      const newTags: string[] = (tags || [])
        .map(t => {
          if (t === 'prev:' + oldStepName) {
            return RESERVED_CELL_NAMES.includes(newStepName)
              ? ''
              : 'prev:' + newStepName;
          } else {
            return t;
          }
        })
        .filter(t => t !== '' && t !== 'prev:');
      allPromises.push(
        CellUtils.setCellMetaData(notebookPanel, i, 'tags', newTags),
      );
    }
    Promise.all(allPromises);
  }

  /**
   * Clean up the Kale tags from a cell. After cleaning the cell, loop though
   * the notebook to remove all occurrences of the deleted step name.
   * @param notebook NotebookPanel object
   * @param activeCellIndex The active cell index
   * @param stepName The old name of the active cell to be cleaned.
   */
  public static resetCell(
    notebook: NotebookPanel,
    activeCellIndex: number,
    stepName: string,
  ) {
    const value = '';
    const previousSteps: string[] = [];

    const oldStepName: string = stepName;
    const cellMetadata = {
      prevStepNames: previousSteps,
      stepName: value,
    };
    TagsUtils.setKaleCellTags(
      notebook,
      activeCellIndex,
      cellMetadata
    ).then(oldValue => {
      TagsUtils.updateKaleCellsTags(notebook, oldStepName, value);
    });
  }

  public static cellsToArray(notebook: NotebookPanel) {
    const cells = notebook.model?.cells;
    const cellsArray = [];
    if (cells) {
      for (let index = 0; index < cells.length; index += 1) {
        const cell = cells.get(index);
        cellsArray.push(cell);
      }
    }
    return cellsArray;
  }

  public static removeOldDependencies(
    notebook: NotebookPanel
  ) {
    const cells = notebook.model?.cells;
    if (!cells) {
      return;
    }

    const allSteps = this.getAllSteps(notebook.content);
    const allStepsSet = new Set(allSteps);

    for (let index = 0; index < cells.length; index++) {
      const kaleTags = this.getKaleCellTags(notebook.content, index);
      if (!kaleTags) {
        continue;
      }

      const newPrevStepNames = kaleTags.prevStepNames.filter(
        dep => allStepsSet.has(dep)
      );

      if (newPrevStepNames.length !== kaleTags.prevStepNames.length) {
        const updatedMetadata = {
          ...kaleTags,
          prevStepNames: newPrevStepNames,
        };

        this.setKaleCellTags(notebook, index, updatedMetadata);
      }
    }

  }
}
