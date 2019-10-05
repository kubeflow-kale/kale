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
            '&$cssFocused $notchedOutline': {
                borderColor: "var(--md-indigo-300) !important",
            }
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
            className={classes.textField}
            id={props.label}
            label={props.label}
            value={props.value}
            onChange={evt => props.updateValue((evt.target as HTMLInputElement).value, props.index)}
            margin="dense"
            variant="outlined"
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
        root: {
            '&outlined': {
                borderColor: 'var(--jp-input-border-color)',
            },
        },
        outlined: {},
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

    }),
);

interface IMaterialSelectMultiple {
    updateSelected: Function,
    options: string[],
    selected: string[]
}
export const MaterialSelectMulti: React.FunctionComponent<IMaterialSelectMultiple> = (props) => {

    const classes = useStylesSelectMulti({});
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
          >
            Select previous blocks
          </InputLabel>
        <Select
            multiple
            classes={{
                root: classes.root,
                outlined: classes.outlined,
            }}
            MenuProps={{
                PaperProps: {
                    className: classes.menu,
                }
            }}
            onChange={evt => props.updateSelected((evt.target as HTMLInputElement).value)}
            margin="dense"
            variant="outlined"
            input={<OutlinedInput margin='dense' labelWidth={labelOffsetWidth} name="previous"  id="select-previous-blocks" />}
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
                </div>
            </div>
        )
};
