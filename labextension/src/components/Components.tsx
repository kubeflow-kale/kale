import * as React from "react";
import {findDOMNode} from "react-dom";
import {
    makeStyles, createStyles, createMuiTheme, withStyles, Theme
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { ThemeProvider } from '@material-ui/styles';
import { indigo } from '@material-ui/core/colors';
import {MenuItem, Select, Button, Input, Tooltip, Zoom} from "@material-ui/core";
import DeleteIcon from '@material-ui/icons/Delete';
import Chip from "@material-ui/core/Chip";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from '@material-ui/core/FormControl';
import OutlinedInput from "@material-ui/core/OutlinedInput";

import { useDebouncedCallback } from 'use-debounce';
import Switch from "react-switch";
import {RokInput} from './RokInput';
import ColorUtils from './cell-metadata/ColorUtils';

// https://codeburst.io/my-journey-to-make-styling-with-material-ui-right-6a44f7c68113
const useStyles = makeStyles(() =>
    createStyles({
        label: {
            color: 'var(--jp-input-border-color)',
            fontSize: "var(--jp-ui-font-size2)"
        },
        input: {
            borderRadius: 4,
            position: 'relative',
            color: "var(--jp-ui-font-color1)",
            fontSize: "var(--jp-ui-font-size2)"
        },
        focused: {},
        // notchedOutline: {
        //     borderWidth: '1px',
        //     borderColor: 'var(--jp-input-border-color)',
        // },
        textField: {
            width: "100%",
        },
        menu: {
            backgroundColor: "var(--jp-layout-color1)",
            color: "var(--jp-ui-font-color1)"
        },
        helperLabel: {
            color: "var(--jp-info-color0)"
        }
    }),
);

const theme = createMuiTheme({
  palette: {
    primary: indigo,
  },
});


export interface IMaterialInput {
    updateValue: Function,
    value: string | number,
    regex?: string,
    regexErrorMsg?: string,
    inputIndex?: number,
    helperText?: string,
    label: string,
    numeric?: boolean,
    readOnly?: boolean,
    extraInputProps?: any,
    variant?: "filled" | "standard" | "outlined",
    onBeforeUpdate?: (value: string) => boolean;
}

export const MaterialInput: React.FunctionComponent<IMaterialInput> = (props) => {

    const [value, setValue] = React.useState('' as any);
    const [error, updateError] = React.useState(false);
    const classes = useStyles({});

    const onChange = (value: string, index: number) => {
        // if the input domain is restricted by a regex
        if (!props.regex) {
            props.updateValue(value, index);
            return;
        }

        let re = new RegExp(props.regex);
        if (!re.test(value)) {
            updateError(true);
        } else {
            updateError(false);
            props.updateValue(value, index)
        }
    };

    React.useEffect(() => {
        // need this to set the value when the notebook is loaded
        // and the metadata is updated
        setValue(props.value)
    }, [props.value]); // Only re-run the effect if props.value changes

    const [debouncedCallback] = useDebouncedCallback(
        // function
        (value, idx) => {
            onChange(value, idx);
        },
        // delay in ms
        500
    );

    let helperText = (props.helperText) ? props.helperText: null;
    helperText = (error)? props.regexErrorMsg: helperText;

    let inputProps = {
        classes: {
            root: classes.input,
            focused: classes.focused,
            // notchedOutline: classes.notchedOutline,
        },
        readOnly: props.readOnly,
    };
    inputProps = {...inputProps, ...props.extraInputProps};

    return <ThemeProvider theme={theme}><TextField
            InputLabelProps={{
                classes: {
                    root: classes.label
                },
                shrink: value !== ''
            }}
            InputProps={inputProps}
            FormHelperTextProps={{
                classes: {
                    root: classes.helperLabel
                }
            }}
            className={classes.textField}
            error={error}
            label={props.label}
            value={value}
            onChange={evt => {
                setValue(evt.target.value);
                if (!props.onBeforeUpdate) {
                    debouncedCallback(evt.target.value, props.inputIndex)
                }else {
                    const r = props.onBeforeUpdate(evt.target.value)
                    if (r) {
                        updateError(true);
                    } else {
                        updateError(false);
                        debouncedCallback(evt.target.value, props.inputIndex)
                    }
                }
            }}
            margin="dense"
            variant={props.variant as any}
            type={props.numeric && 'number'}
            helperText={helperText}
    /></ThemeProvider>
};

interface IMaterialSelect {
    updateValue: Function,
    values: any,
    value: any,
    label: string,
    index: number,
    helperText?: string
    variant?: "filled" | "standard" | "outlined",
}

export const MaterialSelect: React.FunctionComponent<IMaterialSelect> = (props) => {

    const classes = useStyles({});

    const disableMenuItem = (event: React.MouseEvent, invalidOption: boolean) => {
        if (invalidOption) {
            event.stopPropagation();
        }
    }

    return <ThemeProvider theme={theme}>
        <TextField
            select
            InputLabelProps={{
                classes: {
                    root: classes.label
                },
                shrink: props.value !== ''
            }}
            InputProps={{
                classes: {
                    root: classes.input,
                    focused: classes.focused,
                    // notchedOutline: classes.notchedOutline,
                }
            }}
            SelectProps={{
              MenuProps: {
                  PaperProps: {
                    className: classes.menu,
                  }
              },
            }}
            FormHelperTextProps={{
                classes: {
                    root: classes.helperLabel
                }
            }}
            className={classes.textField}
            id={props.label}
            label={props.label}
            value={props.value}
            onChange={evt => props.updateValue((evt.target as HTMLInputElement).value, props.index)}
            margin="dense"
            variant={props.variant as any}
            helperText={ (props.helperText) ? props.helperText : null }
        >
            {props.values.map((option: any) => (
                <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={!!option.invalid}
                    style={!!option.invalid ?
                        { pointerEvents: 'auto', padding: 0 } :
                        { padding: 0 }
                    }
                >
                    {option.tooltip ?
                        <LightTooltip
                            title={option.tooltip}
                            placement='top-start'
                            interactive={!(typeof option.tooltip === 'string')}
                            TransitionComponent={Zoom}
                        >
                            <div
                                onClick={ev=>disableMenuItem(ev, !!option.invalid)}
                                style={{padding: '8px 16px', width: '100%'}}
                            >
                                {option.label}
                            </div>
                        </LightTooltip> :
                        option.label
                    }
                </MenuItem>
            ))}
        </TextField>
    </ThemeProvider>
};


const useStylesSelectMulti = makeStyles(() =>
    createStyles({
        menu: {
            color: "var(--jp-ui-font-color1)",
            fontSize: "var(--jp-ui-font-size2)"
        },
        chips: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        chip: {
            margin: 2,
        },
        multiSelectForm: {
            width: "100%"
        },
        label: {
            backgroundColor: "var(--jp-layout-color1)",
            color: 'var(--jp-input-border-color)',
            fontSize: "var(--jp-ui-font-size2)"
        },
        input: {
            fontSize: "var(--jp-ui-font-size2)"
        }
    }),
);

const outlinedStyle = makeStyles(() =>
    createStyles({
        // root: {
        //     "& $notchedOutline": {
        //         borderWidth: '1px',
        //         borderColor: 'var(--jp-input-border-color)',
        //     },
        // },
        focused: {},
        // notchedOutline: {},
    }));

interface IMaterialSelectMultiple {
    updateSelected: Function,
    options: { value:string, color:string }[],
    selected: string[]
    variant?: "filled" | "standard" | "outlined",
    disabled?:boolean,
}
export const MaterialSelectMulti: React.FunctionComponent<IMaterialSelectMultiple> = (props) => {

    const classes = useStylesSelectMulti({});
    const outlined_classes = outlinedStyle({});
    const [inputLabelRef, setInputLabelRef] = React.useState(undefined);
    const labelOffsetWidth = inputLabelRef
        //@ts-ignore
        ? findDOMNode(inputLabelRef).offsetWidth
    : 0;

    let inputComponent = <Input classes={outlined_classes} margin='dense' name="previous" id="select-previous-blocks" />

    if (!props.variant || props.variant === 'outlined') {
        inputComponent = <OutlinedInput classes={outlined_classes} margin='dense' labelWidth={labelOffsetWidth} name="previous" id="select-previous-blocks" />
    }

    return <ThemeProvider theme={theme}>
        <FormControl
            variant={props.variant}
            margin='dense'
            disabled={props.disabled}
            className={classes.multiSelectForm}>
            <InputLabel
            ref={ref => {
              setInputLabelRef(ref);
            }}
            htmlFor="select-previous-blocks"
            className={classes.label}
          >
            Depends on
          </InputLabel>
        <Select
            multiple
            MenuProps={{
                PaperProps: {
                    className: classes.menu,
                }
            }}
            onChange={evt => props.updateSelected((evt.target as HTMLInputElement).value)}
            margin="dense"
            variant={props.variant}
            input={inputComponent}
            value={props.selected}
            renderValue={elements => (
                <div className={classes.chips}>
                    {(elements as string[]).map(value => {
                        return (
                            <Chip
                                style={{ backgroundColor: `#${ColorUtils.getColor(value)}` }}
                                key={value}
                                label={value}
                                className={`kale-chip ${classes.chip}`} />
                  )})}
                </div>
              )}
        >
            {props.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.value}
                </MenuItem>
            ))}
        </Select>
        </FormControl>
    </ThemeProvider>
};

interface ICollapsablePanel {
    title: string,
    dockerImageValue: string,
    dockerChange: Function,
    debug: boolean,
    changeDebug: Function
}

export const CollapsablePanel: React.FunctionComponent<ICollapsablePanel> = (props) => {
    const [collapsed, setCollapsed] = React.useState(true);

    return (
            <div className={''+(!collapsed && 'jp-Collapse-open')}>
                <div
                    className='jp-Collapse-header kale-header'
                    onClick={_ => setCollapsed(!collapsed)}
                >{props.title}</div>
                <div className={'input-container p-Panel jp-Collapse-contents ' + (collapsed && 'p-mod-hidden')}>
                    <MaterialInput
                        label={"Docker image"}
                        updateValue={props.dockerChange}
                        value={props.dockerImageValue}/>

                    <div className="toolbar" style={{padding: "12px 4px 0 4px"}}>
                        <div className={"switch-label"}>Debug</div>
                        <Switch
                            checked={props.debug}
                            onChange={_ => props.changeDebug()}
                            onColor="#599EF0"
                            onHandleColor="#477EF0"
                            handleDiameter={18}
                            uncheckedIcon={false}
                            checkedIcon={false}
                            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                            activeBoxShadow="0px 0px 1px 7px rgba(0, 0, 0, 0.2)"
                            height={10}
                            width={20}
                            className="skip-switch"
                        />
                    </div>
                </div>
            </div>
        )
};

interface IAnnotationInput {
    updateValue: Function,
    deleteValue: Function,
    annotation: {key: string, value: string},
    volumeIdx: number,
    annotationIdx: number,
    label: string,
    cannotBeDeleted?: boolean,
    rokAvailable?: boolean,
}

export const AnnotationInput: React.FunctionComponent<IAnnotationInput> = (props) => {

    const [annotation, setAnnotation] = React.useState({key: '', value: ''});
    const classes = useStyles({});

    React.useEffect(() => {
        // need this to set the annotation when the notebook is loaded
        // and the metadata is updated
        setAnnotation({...props.annotation})
    }, [props.annotation]); // Only re-run the effect if props.annotation changes

    const updateKey = (key: string) => {
        props.updateValue({...props.annotation, key: key}, props.volumeIdx, props.annotationIdx)
    };

    const updateValue = (value: string) => {
        props.updateValue({...props.annotation, value: value}, props.volumeIdx, props.annotationIdx)
    };

    const valueField = (props.rokAvailable && props.annotation.key === 'rok/origin') ?
        <RokInput
            updateValue={updateValue}
            value={props.annotation.value}
            label={'Rok URL'}
            inputIndex={props.volumeIdx}
            annotationIdx={props.annotationIdx}
        />
        :<MaterialInput
            updateValue={updateValue}
            value={props.annotation.value}
            label={'Value'}
            inputIndex={props.volumeIdx}
        />;

    return <div className='toolbar'>
        <div style={{marginRight: "10px", width: "50%"}}>
            <MaterialInput
                updateValue={updateKey}
                value={props.annotation.key}
                label={'Key'}
                inputIndex={props.volumeIdx}
                readOnly={props.cannotBeDeleted || false}
            />
        </div>
        <div style={{width: "50%"}}>
            {valueField}
        </div>
        {(!props.cannotBeDeleted) ?
            <div className="delete-button">
                <Button
                    variant="contained"
                    size="small"
                    title="Remove Annotation"
                    onClick={_ => props.deleteValue(props.volumeIdx, props.annotationIdx)}
                    style={{transform: 'scale(0.9)'}}
                >
                    <DeleteIcon />
                </Button>
            </div>
            : null
        }
    </div>
};

export const LightTooltip = withStyles((theme: Theme) => ({
    tooltip: {
        backgroundColor: theme.palette.common.white,
        color: 'rgba(0, 0, 0, 0.87)',
        boxShadow: theme.shadows[1],
        fontSize: 'var(--jp-ui-font-size1)',
    },
}))(Tooltip);
