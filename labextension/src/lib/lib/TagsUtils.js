"use strict";
/*
 * Copyright 2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CellUtils_1 = __importDefault(require("./CellUtils"));
const CellMetadataEditor_1 = require("../widgets/cell-metadata/CellMetadataEditor");
const cells_1 = require("@jupyterlab/cells");
/** Contains utility functions for manipulating/handling Kale cell tags. */
class TagsUtils {
    /**
     * Get all the `block:<name>` tags in the notebook.
     * @param notebook Notebook object
     * @returns Array<str> - a list of the block names (i.e. the pipeline steps'
     *  names)
     */
    static getAllBlocks(notebook) {
        if (!notebook.model) {
            return [];
        }
        let blocks = new Set();
        // iterate through the notebook cells
        for (const idx of Array(notebook.model.cells.length).keys()) {
            // get the tags of the current cell
            let mt = this.getKaleCellTags(notebook, idx);
            if (mt && mt.blockName && mt.blockName !== '') {
                blocks.add(mt.blockName);
            }
        }
        return Array.from(blocks);
    }
    /**
     * Given a notebook cell index, get the closest previous cell that has a Kale
     * tag
     * @param notebook The notebook object
     * @param current The index of the cell to start the search from
     * @returns string - Name of the `block` tag of the closest previous cell
     */
    static getPreviousBlock(notebook, current) {
        for (let i = current - 1; i >= 0; i--) {
            let mt = this.getKaleCellTags(notebook, i);
            if (mt &&
                mt.blockName &&
                mt.blockName !== 'skip' &&
                mt.blockName !== '') {
                return mt.blockName;
            }
        }
        return null;
    }
    /**
     * Parse a notebook cell's metadata and return all the Kale tags
     * @param notebook Notebook object
     * @param index The index of the notebook cell
     * @returns IKaleCellTags: an object containing all the cell's Kale tags
     */
    static getKaleCellTags(notebook, index) {
        const tags = CellUtils_1.default.getCellMetaData(notebook, index, 'tags');
        if (tags) {
            let b_name = tags.map(v => {
                if (CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(v)) {
                    return v;
                }
                if (v.startsWith('block:')) {
                    return v.replace('block:', '');
                }
            });
            let prevs = tags
                .filter(v => {
                return v.startsWith('prev:');
            })
                .map(v => {
                return v.replace('prev:', '');
            });
            let limits = {};
            tags
                .filter(v => v.startsWith('limit:'))
                .map(lim => {
                const values = lim.split(':');
                // get the limit key and value
                limits[values[1]] = values[2];
            });
            return {
                blockName: b_name[0],
                prevBlockNames: prevs,
                limits: limits,
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
    static setKaleCellTags(notebookPanel, index, metadata, save) {
        // make the dict to save to tags
        let nb = metadata.blockName;
        // not a reserved name
        if (!CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(metadata.blockName)) {
            nb = 'block:' + nb;
        }
        const stepDependencies = metadata.prevBlockNames || [];
        const limits = metadata.limits || {};
        const tags = [nb]
            .concat(stepDependencies.map(v => 'prev:' + v))
            .concat(Object.keys(limits).map(lim => 'limit:' + lim + ':' + limits[lim]));
        return CellUtils_1.default.setCellMetaData(notebookPanel, index, 'tags', tags, save);
    }
    /**
     * Parse the entire notebook cells to change a block name. This happens when
     * the block name of a cell is changed by the user, using Kale's inline tag
     * editor. We need to parse the entire notebook because all the `prev` dependencies
     * specified in the cells must be bound to the new name.
     * @param notebookPanel NotebookPanel object
     * @param oldBlockName previous block name
     * @param newBlockName new block name
     */
    static updateKaleCellsTags(notebookPanel, oldBlockName, newBlockName) {
        let i;
        const allPromises = [];
        for (i = 0; i < notebookPanel.model.cells.length; i++) {
            const tags = CellUtils_1.default.getCellMetaData(notebookPanel.content, i, 'tags');
            // If there is a prev tag that points to the old name, update it with the
            // new one.
            let newTags = (tags || [])
                .map(t => {
                if (t === 'prev:' + oldBlockName) {
                    return CellMetadataEditor_1.RESERVED_CELL_NAMES.includes(newBlockName)
                        ? ''
                        : 'prev:' + newBlockName;
                }
                else {
                    return t;
                }
            })
                .filter(t => t !== '' && t !== 'prev:');
            allPromises.push(CellUtils_1.default.setCellMetaData(notebookPanel, i, 'tags', newTags, false));
        }
        Promise.all(allPromises).then(() => {
            notebookPanel.context.save();
        });
    }
    /**
     * Clean up the Kale tags from a cell. After cleaning the cell, loop though
     * the notebook to remove all occurrences of the deleted block name.
     * @param notebook NotebookPanel object
     * @param activeCellIndex The active cell index
     * @param stepName The old name of the active cell to be cleaned.
     */
    static resetCell(notebook, activeCellIndex, stepName) {
        const value = '';
        const previousBlocks = [];
        const oldBlockName = stepName;
        let cellMetadata = {
            prevBlockNames: previousBlocks,
            blockName: value,
        };
        TagsUtils.setKaleCellTags(notebook, activeCellIndex, cellMetadata, false).then(oldValue => {
            TagsUtils.updateKaleCellsTags(notebook, oldBlockName, value);
        });
    }
    static cellsToArray(notebook) {
        const cells = notebook.model.cells;
        const cellsArray = [];
        for (let index = 0; index < cells.length; index += 1) {
            const cell = cells.get(index);
            cellsArray.push(cell);
        }
        return cellsArray;
    }
    static removeOldDependencies(notebook, removedCell) {
        if (!(removedCell instanceof cells_1.CodeCellModel)) {
            return;
        }
        const tags = removedCell.metadata.get('tags');
        if (!tags) {
            return;
        }
        const blockName = tags
            .filter(t => t.startsWith('block:'))
            .map(t => t.replace('block:', ''))[0];
        if (!blockName) {
            return;
        }
        const removedDependency = `prev:${blockName}`;
        this.cellsToArray(notebook)
            .filter(cell => cell.metadata.get('tags').includes(removedDependency))
            .forEach(cell => {
            const newTags = cell.metadata.get('tags').filter(e => e !== removedDependency);
            cell.metadata.set('tags', newTags);
        });
        notebook.context.save();
    }
}
exports.default = TagsUtils;
