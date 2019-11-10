import * as React from "react";
import { Chip, Tooltip } from '@material-ui/core';
import ColorUtils from './ColorUtils';
import { RESERVED_CELL_NAMES } from './CellMetadataEditor';

interface InlineMetadata {
    blockName: string;
    parentBlockName: string;
    prevBlockNames?: string[]
    cellElement: any;
}

let inlineMetadataIndex = 0;

export const InlineMetadata: React.FunctionComponent<InlineMetadata> = (props) => {
    let wrapperRef: HTMLElement = null;
    const imIndex = inlineMetadataIndex++;
    const defaultCSSClasses = `kale-inline-cell-metadata kale-inline-cell-metadata-${imIndex}`;
    const [className, setClassName] = React.useState(defaultCSSClasses);
    const [dependencies, setDependencies] = React.useState([]);
    const [color, setColor] = React.useState('');
    const [cellTypeClass, setCellTypeClass] = React.useState('');

    React.useEffect(() => {
        updateClassName()
        checkIfReservedName();
        updateStyles()
        updateDependencies();
        moveElement();
    }, [props.blockName, props.parentBlockName, props.prevBlockNames, props.cellElement]);

    React.useEffect(() => {
        return () => {
            // Cleanup
            const cellElement = props.cellElement;
            cellElement.classList.remove('kale-merged-cell');

            const codeMirrorElem = cellElement.querySelector('.CodeMirror')
            if (codeMirrorElem) {
                codeMirrorElem.style.border = ''
            }

            if (wrapperRef) {
                wrapperRef.remove()
            }
        }
    }, []);

    const updateClassName = () => {
        let c = defaultCSSClasses;
        if (props.parentBlockName) {
            c = c + ' hidden'
        }
        setClassName(c)
    }

    const updateStyles = () => {
        const name = props.blockName || props.parentBlockName;
        if (!name) {
            return;
        }
        const rgb = getColorFromName(name)
        setColor(rgb);

        const cellElement = props.cellElement;

        const codeMirrorElem = cellElement.querySelector('.CodeMirror') as HTMLElement;
        if (codeMirrorElem) {
            codeMirrorElem.style.border = `2px solid #${rgb}`
        }
        if (props.parentBlockName) {
            cellElement.classList.add('kale-merged-cell');
        }
    }

    const updateDependencies = () => {
        setDependencies(props.prevBlockNames.map((name, i) => {
            const rgb = getColorFromName(name)
            return (
                <Tooltip
                    placement="top"
                    key={i}
                    title={name}>
                    <div
                        className="kale-inline-cell-dependency"
                        style={{
                            backgroundColor: `#${rgb}`
                        }}>
                    </div>
                </Tooltip>)
        }))
    }

    const checkIfReservedName = () => {
        if (RESERVED_CELL_NAMES.includes(props.blockName)) {
            setCellTypeClass('kale-reserved-cell')
        } else {
            setCellTypeClass('')
        }
    }

    const moveElement = () => {
        if ((props.blockName || props.parentBlockName) && wrapperRef && !wrapperRef.classList.contains('moved')) {
            wrapperRef.classList.add('moved');
            props.cellElement.insertAdjacentElement('afterbegin', wrapperRef);
        }
    }

    const getColorFromName = (name: string) => {
        return ColorUtils.getColor(name);
    }

    return (
        <div>
            <div className={className} ref={(elem) => {
                if (elem) wrapperRef = elem;
            }} >
                <Chip
                    className={`kale-chip ${cellTypeClass}`}
                    style={{ backgroundColor: `#${color}` }}
                    key={props.blockName}
                    label={props.blockName} />
                {dependencies}
            </div>
        </div>
    );
};