import * as React from "react";
import {findDOMNode} from "react-dom";
import {
    makeStyles, createStyles, createMuiTheme
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { ThemeProvider } from '@material-ui/styles';
import { indigo } from '@material-ui/core/colors';
import {MenuItem, Select} from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from '@material-ui/core/FormControl';
import OutlinedInput from "@material-ui/core/OutlinedInput";

import { useDebouncedCallback } from 'use-debounce';
import Switch from "react-switch";

// https://codeburst.io/my-journey-to-make-styling-with-material-ui-right-6a44f7c68113
const useStyles = makeStyles(() =>
    createStyles({
        label: {
            backgroundColor: "var(--jp-layout-color1)",
            color: 'var(--jp-input-border-color)',
        },
        input: {
            borderRadius: 4,
            position: 'relative',
            color: "var(--jp-ui-font-color1)",
            backgroundColor: "var(--jp-layout-color1)",
        },
        focused: {},
        notchedOutline: {
            borderWidth: '1px',
            borderColor: 'var(--jp-input-border-color)',
        },
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


interface IMaterialInput {
    updateValue: Function,
    value: string,
    regex?: string,
    regexErrorMsg?: string,
    inputIndex?: number,
    helperText?: string,
    label: string,
    numeric?: boolean
}

export const MaterialInput: React.FunctionComponent<IMaterialInput> = (props) => {

    const [value, setValue] = React.useState('');
    const [error, updateError] = React.useState(false);
    const classes = useStyles({});

    const onChange = (value: string, index: number) => {
        // if the input domain is restricted by a regex
        if (props.regex) {
            let re = new RegExp(props.regex);
            if (!re.test(value)) {
                updateError(true);
            } else {
                updateError(false);
            }
        }
        props.updateValue(value, index)
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

    return <ThemeProvider theme={theme}><TextField
            InputLabelProps={{
                classes: {
                    root: classes.label
                }
            }}
            InputProps={{
                classes: {
                    root: classes.input,
                    focused: classes.focused,
                    notchedOutline: classes.notchedOutline,
                }
            }}
            FormHelperTextProps={{
                classes: {
                    root: classes.helperLabel
                }
            }}
            className={classes.textField}
            error={error}
            id="outlined-name"
            label={props.label}
            value={value}
            onChange={evt => {setValue(evt.target.value); debouncedCallback(evt.target.value, props.inputIndex)}}
            margin="dense"
            variant="outlined"
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
}

export const MaterialSelect: React.FunctionComponent<IMaterialSelect> = (props) => {

    const classes = useStyles({});

    return <ThemeProvider theme={theme}>
        <TextField
            select
            InputLabelProps={{
                classes: {
                    root: classes.label
                }
            }}
            InputProps={{
                classes: {
                    root: classes.input,
                    focused: classes.focused,
                    notchedOutline: classes.notchedOutline,
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
            variant="outlined"
            helperText={ (props.helperText) ? props.helperText : null }
        >
            {props.values.map((option: any) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    </ThemeProvider>
};


const useStylesSelectMulti = makeStyles(() =>
    createStyles({
        menu: {
            backgroundColor: "var(--jp-layout-color1)",
            color: "var(--jp-ui-font-color1)"
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
        },
    }),
);

const outlinedStyle = makeStyles(() =>
    createStyles({
        root: {
            "& $notchedOutline": {
                borderWidth: '1px',
                borderColor: 'var(--jp-input-border-color)',
            },
        },
        focused: {},
        notchedOutline: {},
    }));

interface IMaterialSelectMultiple {
    updateSelected: Function,
    options: string[],
    selected: string[]
}
export const MaterialSelectMulti: React.FunctionComponent<IMaterialSelectMultiple> = (props) => {

    const classes = useStylesSelectMulti({});
    const outlined_classes = outlinedStyle({});
    const [inputLabelRef, setInputLabelRef] = React.useState(undefined);
    const labelOffsetWidth = inputLabelRef
        //@ts-ignore
        ? findDOMNode(inputLabelRef).offsetWidth
    : 0;

    return <ThemeProvider theme={theme}>
        <FormControl variant='outlined' margin='dense' className={classes.multiSelectForm}>
            <InputLabel
            ref={ref => {
              setInputLabelRef(ref);
            }}
            htmlFor="select-previous-blocks"
            className={classes.label}
          >
            Select previous blocks
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
            variant="outlined"
            input={<OutlinedInput classes={outlined_classes} margin='dense' labelWidth={labelOffsetWidth} name="previous"  id="select-previous-blocks" />}
            value={props.selected}
            renderValue={elements => (
                <div className={classes.chips}>
                  {(elements as string[]).map(value => (
                    <Chip key={value} label={value} className={classes.chip} />
                  ))}
                </div>
              )}
        >
            {props.options.map((option: any) => (
                <MenuItem key={option} value={option}>
                    {option}
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
            <div className={'jp-Collapse ' + (!collapsed && 'jp-Collapse-open')}>
                <div
                    className='jp-Collapse-header'
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

    return <div className='toolbar'>
        <MaterialInput
            updateValue={updateKey}
            value={props.annotation.key}
            label={'Key'}
            inputIndex={props.volumeIdx}
        />
        <MaterialInput
            updateValue={updateValue}
            value={props.annotation.value}
            label={'Value'}
            inputIndex={props.volumeIdx}
        />
        <div>
            <button type="button"
                className="minimal-toolbar-button"
                title="Delete Annotation"
                onClick={_ => props.deleteValue(props.volumeIdx, props.annotationIdx)}
            >
            <span
                className="jp-CloseIcon jp-Icon jp-Icon-16"
                style={{padding: 0, flex: "0 0 auto", marginRight: 0}}/>
            </button>
        </div>
    </div>
};