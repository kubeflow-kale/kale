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
import { isCodeCellModel } from '@jupyterlab/cells';
import { CellMetadataContext } from '../../../lib/CellMetadataContext';

/**
 * Hook that manages the editor's DOM positioning inside the active notebook
 * cell and auto-hides the editor when the active cell is not a code cell.
 */
export function useEditorPosition(
  editorRef: React.RefObject<HTMLDivElement | null>,
  notebook: NotebookPanel,
) {
  const { activeCellIndex, isEditorVisible, onEditorVisibilityChange } =
    React.useContext(CellMetadataContext);

  React.useEffect(() => {
    const ref = editorRef;
    return () => {
      ref.current?.remove();
    };
  }, [editorRef]);

  React.useLayoutEffect(() => {
    // hide editor if active cell is not code cell
    if (notebook && !notebook.isDisposed && notebook.model) {
      const cellModel = notebook.model.cells.get(activeCellIndex);
      if (cellModel && !isCodeCellModel(cellModel) && isEditorVisible) {
        onEditorVisibilityChange(false);
      }
    }

    if (!notebook?.content?.node?.childNodes) {
      return;
    }

    const cellWidget = notebook.content.widgets[activeCellIndex];
    if (!cellWidget) {
      return;
    }

    const metadataWrapper = cellWidget.node as HTMLElement;
    if (!metadataWrapper) {
      return;
    }

    const editor = editorRef.current;
    if (editor && editor.parentElement !== metadataWrapper) {
      editor.remove();
      metadataWrapper.prepend(editor);
    }
  }, [
    activeCellIndex,
    notebook,
    isEditorVisible,
    onEditorVisibilityChange,
    editorRef,
  ]);
}
