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
import { useState, useEffect, useRef, useCallback } from 'react';
import { CellList, NotebookPanel } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IObservableList } from '@jupyterlab/observables';
import { CodeCellModel, ICellModel, isCodeCellModel } from '@jupyterlab/cells';
import CellUtils from '../../../lib/CellUtils';
import TagsUtils from '../../../lib/TagsUtils';
import { InlineMetadata } from '../InlineMetadata';
import { IProps as EditorProps } from '../CellMetadataEditor';
import { createPortal } from 'react-dom';

export type Editors = { [index: string]: EditorProps };
type SaveState = 'started' | 'completed' | 'failed';

/** Keep inline labels below the cell metadata editor when it is mounted in the cell. */
function insertMetadataParent(
  cellElement: HTMLElement,
  metadataParent: HTMLDivElement,
): void {
  const editorWrapper = cellElement.querySelector(
    '.kale-metadata-editor-wrapper',
  );
  if (editorWrapper) {
    cellElement.insertBefore(metadataParent, editorWrapper.nextSibling);
  } else {
    cellElement.prepend(metadataParent);
  }
}

interface IUseInlineMetadataOptions {
  pipelineBaseImage?: string;
  defaultBaseImage?: string;
  /** Called when the active cell's metadata changes (e.g. user edits step name). */
  onActiveMetadataChange?: () => void;
  /** Called when cells are added, removed, or change type. */
  onCellsChanged?: () => void;
}

/**
 * Manages the inline metadata overlays (React portals) rendered on top of
 * each code cell, and the editor-props lookup table. Handles all JupyterLab
 * signal wiring for save state, cell list changes, and active-cell metadata
 * changes.
 */
export function useInlineMetadata(
  notebook: NotebookPanel,
  enabled: boolean,
  activeCellIndex: number,
  options: IUseInlineMetadataOptions = {},
): { editors: Editors; metadataCmp: React.ReactPortal[] } {
  const [metadataCmp, setMetadataCmp] = useState<React.ReactPortal[]>([]);
  const [editors, setEditors] = useState<Editors>({});

  const notebookRef = useRef(notebook);
  notebookRef.current = notebook;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const pipelineBaseImageRef = useRef(options.pipelineBaseImage);
  pipelineBaseImageRef.current = options.pipelineBaseImage;
  const defaultBaseImageRef = useRef(options.defaultBaseImage);
  defaultBaseImageRef.current = options.defaultBaseImage;
  const onActiveMetadataChangeRef = useRef(options.onActiveMetadataChange);
  onActiveMetadataChangeRef.current = options.onActiveMetadataChange;
  const onCellsChangedRef = useRef(options.onCellsChanged);
  onCellsChangedRef.current = options.onCellsChanged;

  const portalContainersRef = useRef<HTMLDivElement[]>([]);

  const removeOldPortalContainers = useCallback(() => {
    portalContainersRef.current.forEach(el => el.remove());
    portalContainersRef.current = [];
  }, []);

  const generate = useCallback(() => {
    const nb = notebookRef.current;
    if (!nb || !nb.model) {
      return;
    }

    removeOldPortalContainers();

    const metadata: React.ReactPortal[] = [];
    const newEditors: Editors = {};
    const newContainers: HTMLDivElement[] = [];
    const cells = nb.model.cells;

    for (let index = 0; index < cells.length; index++) {
      const cellModel = nb.model.cells.get(index);
      if (!isCodeCellModel(cellModel)) {
        continue;
      }

      let tags = TagsUtils.getKaleCellTags(nb.content, index);
      if (!tags) {
        tags = { stepName: '', prevStepNames: [] };
      }

      let previousStepName: string | undefined = '';
      if (!tags.stepName) {
        previousStepName = TagsUtils.getPreviousStep(nb.content, index);
      }

      newEditors[index] = {
        notebook: nb,
        stepName: tags.stepName || '',
        stepDependencies: tags.prevStepNames || [],
        limits: tags.limits || {},
        baseImage: tags.baseImage,
        enableCaching: tags.enableCaching,
      };

      const cellElement = nb.content.widgets[index].node as HTMLElement;
      if (!cellElement) {
        console.warn(
          `Failed to get cell element for index ${index}, skipping metadata creation`,
        );
        continue;
      }

      const metadataParent = document.createElement('div');
      newContainers.push(metadataParent);
      if (cellElement.childNodes.length === 0) {
        new MutationObserver((_, obs) => {
          insertMetadataParent(cellElement, metadataParent);
          obs.disconnect();
        }).observe(cellElement, { childList: true });
      } else {
        insertMetadataParent(cellElement, metadataParent);
      }

      metadata.push(
        createPortal(
          <InlineMetadata
            key={index}
            cellElement={cellElement}
            stepName={tags.stepName}
            stepDependencies={tags.prevStepNames}
            limits={tags.limits || {}}
            baseImage={tags.baseImage}
            enableCaching={tags.enableCaching}
            previousStepName={previousStepName}
            cellIndex={index}
            pipelineBaseImage={pipelineBaseImageRef.current}
            defaultBaseImage={defaultBaseImageRef.current}
          />,
          metadataParent,
        ),
      );
    }

    portalContainersRef.current = newContainers;
    setMetadataCmp(metadata);
    setEditors(newEditors);
  }, [removeOldPortalContainers]);

  const clear = useCallback(() => {
    removeOldPortalContainers();
    setMetadataCmp([]);
    setEditors({});
  }, [removeOldPortalContainers]);

  const refresh = useCallback(() => {
    if (enabledRef.current) {
      generate();
    }
  }, [generate]);

  const handleSaveState = useCallback(
    (_context: DocumentRegistry.Context, state: SaveState) => {
      if (enabledRef.current && state === 'completed') {
        generate();
      }
    },
    [generate],
  );

  const handleCellChange = useCallback(
    (_cells: CellList, args: IObservableList.IChangedArgs<ICellModel>) => {
      const prevValue = args.oldValues[0];
      if (args.type === 'set' && prevValue instanceof CodeCellModel) {
        CellUtils.setCellMetaData(
          notebookRef.current,
          args.newIndex,
          'tags',
          [],
        );
      }
      if (args.type === 'remove') {
        TagsUtils.removeOldDependencies(notebookRef.current);
      }
      refresh();
      onCellsChangedRef.current?.();
    },
    [refresh],
  );

  const onMetadataChange = useCallback(
    (_: any) => {
      refresh();
      onActiveMetadataChangeRef.current?.();
    },
    [refresh],
  );

  useEffect(() => {
    if (!notebook) {
      clear();
      return;
    }

    let cancelled = false;
    notebook.context.ready.then(() => {
      if (cancelled) {
        return;
      }
      notebook.context.saveState.connect(handleSaveState);
      if (notebook.model) {
        notebook.model.cells.changed.connect(handleCellChange);
      }
      if (enabledRef.current) {
        generate();
      }
    });

    return () => {
      cancelled = true;
      notebook.context.saveState.disconnect(handleSaveState);
      if (notebook.model) {
        notebook.model.cells.changed.disconnect(handleCellChange);
      }
    };
  }, [notebook, handleSaveState, handleCellChange, generate, clear]);

  useEffect(() => {
    if (!notebook?.model || !enabledRef.current) {
      return;
    }
    const cellModel = notebook.model.cells.get(activeCellIndex);
    if (!cellModel) {
      return;
    }

    cellModel.metadataChanged.connect(onMetadataChange);
    return () => {
      cellModel.metadataChanged.disconnect(onMetadataChange);
    };
  }, [notebook, activeCellIndex, onMetadataChange]);

  const prevEnabledRef = useRef(enabled);
  useEffect(() => {
    if (enabled && !prevEnabledRef.current) {
      generate();
    } else if (!enabled && prevEnabledRef.current) {
      clear();
    }
    prevEnabledRef.current = enabled;
  }, [enabled, generate, clear]);

  return { editors, metadataCmp };
}
