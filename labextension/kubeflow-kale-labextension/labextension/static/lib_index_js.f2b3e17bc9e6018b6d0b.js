"use strict";
(self["webpackChunkkubeflow_kale_labextension"] = self["webpackChunkkubeflow_kale_labextension"] || []).push([["lib_index_js"],{

/***/ "./lib/Theme.js":
/*!**********************!*\
  !*** ./lib/Theme.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   theme: () => (/* binding */ theme)
/* harmony export */ });
/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @mui/material/styles */ "./node_modules/@mui/material/esm/styles/createTheme.js");

const theme = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_0__["default"])({
    palette: {
        secondary: {
            main: '#753BBD',
            dark: '#512984',
            light: '#9062ca',
        },
        primary: {
            main: '#2e82d7',
            dark: '#205b96',
            light: '#579bdf',
        },
    },
    kale: {
        headers: {
            main: '#753BBD',
        },
    },
});


/***/ }),

/***/ "./lib/components/DeployButton.js":
/*!****************************************!*\
  !*** ./lib/components/DeployButton.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SplitDeployButton: () => (/* binding */ SplitDeployButton)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material_Grid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material/Grid */ "./node_modules/@mui/material/esm/Grid/Grid.js");
/* harmony import */ var _mui_material_Button__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/material/Button */ "./node_modules/@mui/material/esm/Button/Button.js");
/* harmony import */ var _mui_material_ButtonGroup__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @mui/material/ButtonGroup */ "./node_modules/@mui/material/esm/ButtonGroup/ButtonGroup.js");
/* harmony import */ var _mui_icons_material_MoreVert__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @mui/icons-material/MoreVert */ "./node_modules/@mui/icons-material/esm/MoreVert.js");
/* harmony import */ var _mui_material_ClickAwayListener__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @mui/material/ClickAwayListener */ "./node_modules/@mui/material/esm/ClickAwayListener/ClickAwayListener.js");
/* harmony import */ var _mui_material_Grow__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @mui/material/Grow */ "./node_modules/@mui/material/esm/Grow/Grow.js");
/* harmony import */ var _mui_material_Paper__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @mui/material/Paper */ "./node_modules/@mui/material/esm/Paper/Paper.js");
/* harmony import */ var _mui_material_Popper__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @mui/material/Popper */ "./node_modules/@mui/material/esm/Popper/Popper.js");
/* harmony import */ var _mui_material_MenuItem__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @mui/material/MenuItem */ "./node_modules/@mui/material/esm/MenuItem/MenuItem.js");
/* harmony import */ var _mui_material_MenuList__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @mui/material/MenuList */ "./node_modules/@mui/material/esm/MenuList/MenuList.js");
/* harmony import */ var _mui_material_CircularProgress__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @mui/material/CircularProgress */ "./node_modules/@mui/material/esm/CircularProgress/CircularProgress.js");
/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @mui/material/styles */ "./node_modules/@mui/material/esm/styles/styled.js");
// /*
//  * Copyright 2019-2020 The Kale Authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// import * as React from 'react';
// import Grid from '@mui/material/Grid';
// import Button from '@mui/material/Button';
// import ButtonGroup from '@mui/material/ButtonGroup';
// import MoreVertIcon from '@mui/icons-material/MoreVert';
// import ClickAwayListener from '@mui/material/ClickAwayListener';
// import Grow from '@mui/material/Grow';
// import Paper from '@mui/material/Paper';
// import Popper from '@mui/material/Popper';
// import MenuItem from '@mui/material/MenuItem';
// import MenuList from '@mui/material/MenuList';
// import CircularProgress from '@mui/material/CircularProgress';
// interface ISplitDeployButton {
//   running: boolean;
//   handleClick: Function;
//   katibRun: boolean;
// }
// export const SplitDeployButton: React.FunctionComponent<ISplitDeployButton> = props => {
//   const [open, setOpen] = React.useState(false);
//   const anchorRef = React.useRef<HTMLDivElement>(null);
//   const [selectedIndex, setSelectedIndex] = React.useState(0);
//   const options = [
//     {
//       label: 'Compile and Run' + (props.katibRun ? ' Katib Job' : ''),
//       value: 'run',
//     },
//     { label: 'Compile and Upload', value: 'upload' },
//     { label: 'Compile and Save', value: 'compile' },
//   ];
//   const handleMenuItemClick = (
//     event: React.MouseEvent<HTMLLIElement>,
//     index: number,
//   ) => {
//     setSelectedIndex(index);
//     setOpen(false);
//   };
//   const handleToggle = () => {
//     setOpen(prevOpen => !prevOpen);
//   };
//   const handleClose = (event: React.MouseEvent | TouchEvent) => {
//     if (anchorRef.current && 
//       event.target instanceof Node &&
//       anchorRef.current.contains(event.target)) {
//       return;
//     }
//     setOpen(false);
//   };
//   return (
//     <div className="deploy-button">
//       <Grid container>
//         <Grid item xs={12} style={{ padding: '4px 10px' }}>
//           <ButtonGroup
//             style={{ width: '100%' }}
//             variant="contained"
//             color="primary"
//             ref={anchorRef}
//             aria-label="split button"
//           >
//             <Button
//               color="primary"
//               style={{ width: '100%' }}
//               onClick={_ => props.handleClick(options[selectedIndex].value)}
//             >
//               {props.running ? (
//                 <CircularProgress thickness={6} size={14} color={'secondary'} />
//               ) : (
//                 options[selectedIndex].label
//               )}
//               {/*{"  " + options[selectedIndex].label}*/}
//             </Button>
//             <Button
//               color="primary"
//               size="small"
//               aria-owns={open ? 'menu-list-grow' : undefined}
//               aria-haspopup="true"
//               onClick={handleToggle}
//               style={{ width: 'auto' }}
//             >
//               <MoreVertIcon />
//             </Button>
//           </ButtonGroup>
//           <Popper
//             color="primary"
//             style={{ zIndex: 2 }}
//             open={open}
//             anchorEl={anchorRef.current}
//             transition
//             disablePortal
//           >
//             {({ TransitionProps, placement }) => (
//               <Grow
//                 {...TransitionProps}
//                 style={{
//                   transformOrigin:
//                     placement === 'bottom' ? 'center top' : 'center bottom',
//                 }}
//               >
//                 <Paper id="menu-list-grow">
//                   <ClickAwayListener onClickAway={handleClose}>
//                     <MenuList>
//                       {options.map((option, index) => (
//                         <MenuItem
//                           key={option.value}
//                           // disabled={index === 2}
//                           selected={index === selectedIndex}
//                           onClick={event => handleMenuItemClick(event, index)}
//                         >
//                           {option.label}
//                         </MenuItem>
//                       ))}
//                     </MenuList>
//                   </ClickAwayListener>
//                 </Paper>
//               </Grow>
//             )}
//           </Popper>
//         </Grid>
//       </Grid>
//     </div>
//   );
// };













const DeployButtonContainer = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_12__["default"])('div')({
    '& .deploy-button': {
    // Add any specific styling for the deploy button container
    },
});
const StyledButtonGroup = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_12__["default"])(_mui_material_ButtonGroup__WEBPACK_IMPORTED_MODULE_3__["default"])({
    width: '100%',
});
const MainButton = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_12__["default"])(_mui_material_Button__WEBPACK_IMPORTED_MODULE_2__["default"])({
    width: '100%',
});
const DropdownButton = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_12__["default"])(_mui_material_Button__WEBPACK_IMPORTED_MODULE_2__["default"])({
    width: 'auto',
});
const StyledPopper = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_12__["default"])(_mui_material_Popper__WEBPACK_IMPORTED_MODULE_8__["default"])({
    zIndex: 2,
});
const SplitDeployButton = (props) => {
    const [open, setOpen] = react__WEBPACK_IMPORTED_MODULE_0__.useState(false);
    const anchorRef = react__WEBPACK_IMPORTED_MODULE_0__.useRef(null);
    const [selectedIndex, setSelectedIndex] = react__WEBPACK_IMPORTED_MODULE_0__.useState(0);
    const options = [
        {
            label: 'Compile and Run',
            value: 'run',
        },
        { label: 'Compile and Upload', value: 'upload' },
        { label: 'Compile and Save', value: 'compile' },
    ];
    const handleMenuItemClick = (event, index) => {
        setSelectedIndex(index);
        setOpen(false);
    };
    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };
    const handleClose = (event) => {
        if (anchorRef.current &&
            event.target instanceof Node &&
            anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };
    const handleMainButtonClick = () => {
        props.handleClick(options[selectedIndex].value);
    };
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(DeployButtonContainer, null,
        react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-button" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_Grid__WEBPACK_IMPORTED_MODULE_1__["default"], { container: true },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_Grid__WEBPACK_IMPORTED_MODULE_1__["default"], { size: 12, sx: { padding: '4px 10px' } },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(StyledButtonGroup, { variant: "contained", color: "primary", ref: anchorRef, "aria-label": "split button" },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(MainButton, { color: "primary", onClick: handleMainButtonClick, disabled: props.running }, props.running ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_CircularProgress__WEBPACK_IMPORTED_MODULE_11__["default"], { thickness: 6, size: 14, color: "secondary" })) : (options[selectedIndex].label)),
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(DropdownButton, { color: "primary", size: "small", "aria-controls": open ? 'menu-list-grow' : undefined, "aria-haspopup": "true", onClick: handleToggle },
                            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_MoreVert__WEBPACK_IMPORTED_MODULE_4__["default"], null))),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(StyledPopper, { open: open, anchorEl: anchorRef.current, transition: true, disablePortal: true }, ({ TransitionProps, placement }) => (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_Grow__WEBPACK_IMPORTED_MODULE_6__["default"], { ...TransitionProps, style: {
                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                        } },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_Paper__WEBPACK_IMPORTED_MODULE_7__["default"], { id: "menu-list-grow" },
                            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_ClickAwayListener__WEBPACK_IMPORTED_MODULE_5__.ClickAwayListener, { onClickAway: handleClose },
                                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_MenuList__WEBPACK_IMPORTED_MODULE_10__["default"], null, options.map((option, index) => (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_MenuItem__WEBPACK_IMPORTED_MODULE_9__["default"], { key: option.value, selected: index === selectedIndex, onClick: (event) => handleMenuItemClick(event, index) }, option.label))))))))))))));
};


/***/ }),

/***/ "./lib/components/ExperimentInput.js":
/*!*******************************************!*\
  !*** ./lib/components/ExperimentInput.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExperimentInput: () => (/* binding */ ExperimentInput)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Input__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Input */ "./lib/components/Input.js");
/* harmony import */ var _Select__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Select */ "./lib/components/Select.js");
/* harmony import */ var _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../widgets/LeftPanel */ "./lib/widgets/LeftPanel.js");
// /*
//  * Copyright 2019-2020 The Kale Authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// import * as React from 'react';
// import { Input } from './Input';
// import { Select, ISelectOption } from './Select';
// import { IExperiment, NEW_EXPERIMENT } from '../widgets/LeftPanel';
// const regex: string = '^[a-z]([-a-z0-9]*[a-z0-9])?$';
// const regexErrorMsg: string =
//   'Experiment name may consist of alphanumeric ' +
//   "characters, '-', and must start with a lowercase character and end with " +
//   'a lowercase alphanumeric character.';
// interface IExperimentInput {
//   updateValue: Function;
//   options: IExperiment[];
//   selected: string; // Experiment ID
//   value: string; // Experiment Name
//   loading: boolean;
// }
// export const ExperimentInput: React.FunctionComponent<IExperimentInput> = props => {
//   const getName = (x: string) => {
//     const filtered = props.options.filter(o => o.id === x);
//     return filtered.length === 0 ? '' : filtered[0].name;
//   };
//   const updateSelected = (selected: string, idx: number) => {
//     let value = selected === NEW_EXPERIMENT.id ? '' : getName(selected);
//     const experiment: IExperiment = { id: selected, name: value };
//     props.updateValue(experiment);
//   };
//   const updateValue = (value: string, idx: number) => {
//     const experiment: IExperiment = { name: value, id: NEW_EXPERIMENT.id };
//     props.updateValue(experiment);
//   };
// const options: ISelectOption[] = props.options.map(o => {
//   return { label: o.name, value: o.id };
// });
//   return (
//     <div>
//       <Select
//         variant="standard"
//         label="Select experiment"
//         values={options}
//         value={props.selected}
//         index={-1}
//         updateValue={updateSelected}
//         helperText={props.loading ? 'Loading...' : null}
//       />
//       {props.selected === NEW_EXPERIMENT.id ? (
//         <div>
//           <Input
//             updateValue={updateValue}
//             value={props.value}
//             label="Experiment Name"
//             regex={regex}
//             regexErrorMsg={regexErrorMsg}
//             variant="standard"
//           />
//         </div>
//       ) : null}
//     </div>
//   );
// };




const regex = '^[a-z]([-a-z0-9]*[a-z0-9])?$';
const regexErrorMsg = 'Experiment name may consist of alphanumeric ' +
    "characters, '-', and must start with a lowercase character and end with " +
    'a lowercase alphanumeric character.';
const ExperimentInput = (props) => {
    const getName = (x) => {
        const filtered = props.options.filter(o => o.id === x);
        return filtered.length === 0 ? '' : filtered[0].name;
    };
    const updateSelected = (selected, index) => {
        const value = selected === _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_3__.NEW_EXPERIMENT.id ? '' : getName(selected);
        const experiment = { id: selected, name: value };
        props.updateValue(experiment);
    };
    const updateValue = (value, index) => {
        const experiment = { name: value, id: _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_3__.NEW_EXPERIMENT.id };
        props.updateValue(experiment);
    };
    const options = props.options.map((o) => ({
        label: o.name,
        value: o.id,
    }));
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null,
        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_Select__WEBPACK_IMPORTED_MODULE_2__.Select, { variant: "standard", label: "Select experiment", values: options, value: props.selected, index: -1, updateValue: updateSelected, helperText: props.loading ? 'Loading...' : null }),
        props.selected === _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_3__.NEW_EXPERIMENT.id && (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_Input__WEBPACK_IMPORTED_MODULE_1__.Input, { updateValue: updateValue, value: props.value, label: "Experiment Name", regex: regex, regexErrorMsg: regexErrorMsg, variant: "standard", inputIndex: 0 })))));
};


/***/ }),

/***/ "./lib/components/Input.js":
/*!*********************************!*\
  !*** ./lib/components/Input.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Input: () => (/* binding */ Input)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var use_debounce__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! use-debounce */ "webpack/sharing/consume/default/use-debounce/use-debounce");
/* harmony import */ var use_debounce__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(use_debounce__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _mui_material_TextField__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/material/TextField */ "./node_modules/@mui/material/esm/TextField/TextField.js");
/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @mui/material/styles */ "./node_modules/@mui/material/esm/styles/styled.js");
// /*
//  * Copyright 2020 The Kale Authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// import * as React from 'react';
// import { useDebouncedCallback } from 'use-debounce';
// import TextField, { OutlinedTextFieldProps } from '@material-ui/core/TextField';
// import { createStyles, makeStyles } from '@material-ui/core/styles';
// const useStyles = makeStyles(() =>
//   createStyles({
//     label: {
//       color: 'var(--jp-input-border-color)',
//       fontSize: 'var(--jp-ui-font-size2)',
//     },
//     input: {
//       color: 'var(--jp-ui-font-color1)',
//     },
//     textField: {
//       width: '100%',
//     },
//     helperLabel: {
//       color: 'var(--jp-info-color0)',
//     },
//   }),
// );
// // @ts-ignore
// export interface InputProps extends OutlinedTextFieldProps {
//   value: string | number;
//   regex?: string;
//   regexErrorMsg?: string;
//   inputIndex?: number;
//   helperText?: string;
//   readOnly?: boolean;
//   validation?: 'int' | 'double';
//   variant?: 'standard' | 'outlined' | 'filled';
//   updateValue: Function;
//   onBeforeUpdate?: (value: string) => boolean;
// }
// export const Input: React.FunctionComponent<InputProps> = props => {
//   const [value, setValue] = React.useState('' as any);
//   const [error, updateError] = React.useState(false);
//   const classes = useStyles({});
//   const {
//     value: propsValue,
//     className,
//     helperText = null,
//     regex,
//     regexErrorMsg,
//     validation,
//     placeholder,
//     inputIndex,
//     readOnly = false,
//     variant = 'outlined',
//     InputProps,
//     updateValue,
//     onBeforeUpdate = undefined,
//     ...rest
//   } = props;
//   const getRegex = () => {
//     if (regex) {
//       return regex;
//     } else if (validation && validation == 'int') {
//       return /^(-\d)?\d*$/;
//     } else if (validation && validation == 'double') {
//       return /^(-\d)?\d*(\.\d)?\d*$/;
//     } else {
//       return undefined;
//     }
//   };
//   const getRegexMessage = () => {
//     if (regexErrorMsg) {
//       return regexErrorMsg;
//     } else if (validation && validation == 'int') {
//       return 'Integer value required';
//     } else if (validation && validation == 'double') {
//       return 'Double value required';
//     } else {
//       return undefined;
//     }
//   };
//   const onChange = (value: string, index: number) => {
//     // if the input domain is restricted by a regex
//     if (!getRegex()) {
//       updateValue(value, index);
//       return;
//     }
//     let re = new RegExp(getRegex());
//     if (!re.test(value)) {
//       updateError(true);
//     } else {
//       updateError(false);
//       updateValue(value, index);
//     }
//   };
//   React.useEffect(() => {
//     // need this to set the value when the notebook is loaded and the metadata
//     // is updated
//     setValue(propsValue);
//   }, [propsValue]); // Only re-run the effect if propsValue changes
//   const [debouncedCallback] = useDebouncedCallback(
//     // function
//     (value: string, idx: number) => {
//       onChange(value, idx);
//     },
//     // delay in ms
//     500,
//   );
//   return (
//     // @ts-ignore
//     <TextField
//       {...rest}
//       variant={variant}
//       className={classes.textField}
//       error={error}
//       value={value}
//       margin="dense"
//       placeholder={placeholder}
//       spellCheck={false}
//       helperText={error ? getRegexMessage() : helperText}
//       InputProps={{
//         classes: { root: classes.input },
//         readOnly: readOnly,
//         ...InputProps,
//       }}
//       InputLabelProps={{
//         classes: { root: classes.label },
//         shrink: !!placeholder || value !== '',
//       }}
//       FormHelperTextProps={{ classes: { root: classes.helperLabel } }}
//       onChange={evt => {
//         setValue(evt.target.value);
//         if (!onBeforeUpdate) {
//           debouncedCallback(evt.target.value, inputIndex);
//         } else {
//           const r = onBeforeUpdate(evt.target.value);
//           if (r) {
//             updateError(true);
//           } else {
//             updateError(false);
//             debouncedCallback(evt.target.value, inputIndex);
//           }
//         }
//       }}
//     />
//   );
// };
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




const StyledTextField = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_3__["default"])(_mui_material_TextField__WEBPACK_IMPORTED_MODULE_2__["default"])({
    width: '100%',
    '& .MuiInputLabel-root': {
        color: 'var(--jp-input-border-color)',
        fontSize: 'var(--jp-ui-font-size2)'
    },
    '& .MuiInputBase-input': {
        color: 'var(--jp-ui-font-color1)'
    },
    '& .MuiFormHelperText-root': {
        color: 'var(--jp-info-color0)'
    }
});
const Input = props => {
    const [value, setValue] = react__WEBPACK_IMPORTED_MODULE_0__.useState('');
    const [error, updateError] = react__WEBPACK_IMPORTED_MODULE_0__.useState(false);
    const { value: propsValue, className, helperText = null, regex, regexErrorMsg, validation, placeholder, inputIndex, readOnly = false, variant = 'outlined', InputProps, updateValue, onBeforeUpdate = undefined, ...rest } = props;
    const getRegex = () => {
        if (regex) {
            return regex;
        }
        else if (validation && validation === 'int') {
            return /^(-\d)?\d*$/;
        }
        else if (validation && validation === 'double') {
            return /^(-\d)?\d*(\.\d)?\d*$/;
        }
        else {
            return undefined;
        }
    };
    const getRegexMessage = () => {
        if (regexErrorMsg) {
            return regexErrorMsg;
        }
        else if (validation && validation === 'int') {
            return 'Integer value required';
        }
        else if (validation && validation === 'double') {
            return 'Double value required';
        }
        else {
            return undefined;
        }
    };
    const onChange = (value, index) => {
        // if the input domain is restricted by a regex
        const regexPattern = getRegex();
        if (!regexPattern) {
            updateValue(value, index);
            return;
        }
        const re = new RegExp(regexPattern);
        if (!re.test(value)) {
            updateError(true);
        }
        else {
            updateError(false);
            updateValue(value, index);
        }
    };
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(() => {
        // need this to set the value when the notebook is loaded and the metadata
        // is updated
        setValue(propsValue);
    }, [propsValue]); // Only re-run the effect if propsValue changes
    const debouncedCallback = (0,use_debounce__WEBPACK_IMPORTED_MODULE_1__.useDebouncedCallback)(
    // function
    (value, idx) => {
        onChange(value, idx);
    }, 
    // delay in ms
    500);
    const handleChange = (evt) => {
        const newValue = evt.target.value;
        setValue(newValue);
        if (!onBeforeUpdate) {
            debouncedCallback(newValue, inputIndex);
        }
        else {
            const hasError = onBeforeUpdate(newValue);
            if (hasError) {
                updateError(true);
            }
            else {
                updateError(false);
                debouncedCallback(newValue, inputIndex);
            }
        }
    };
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(StyledTextField, { ...rest, variant: variant, className: className, error: error, value: value, margin: "dense", placeholder: placeholder, spellCheck: false, helperText: error ? getRegexMessage() : helperText, slotProps: {
            input: {
                readOnly: readOnly,
                ...InputProps
            },
            inputLabel: {
                shrink: !!placeholder || value !== ''
            }
        }, onChange: handleChange }));
};


/***/ }),

/***/ "./lib/components/LightTooltip.js":
/*!****************************************!*\
  !*** ./lib/components/LightTooltip.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LightTooltip: () => (/* binding */ LightTooltip)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material/styles */ "./node_modules/@mui/material/esm/styles/styled.js");
/* harmony import */ var _mui_material_Tooltip__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/material/Tooltip */ "./node_modules/@mui/material/esm/Tooltip/Tooltip.js");
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



const LightTooltip = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_1__["default"])(({ className, ...props }) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_mui_material_Tooltip__WEBPACK_IMPORTED_MODULE_2__["default"], { ...props, classes: { popper: className } })))(({ theme }) => ({
    [`& .MuiTooltip-tooltip`]: {
        backgroundColor: theme.palette.common.white,
        color: 'rgba(0, 0, 0, 0.87)',
        boxShadow: theme.shadows[1],
        fontSize: 'var(--jp-ui-font-size1)',
    },
}));


/***/ }),

/***/ "./lib/components/Select.js":
/*!**********************************!*\
  !*** ./lib/components/Select.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Select: () => (/* binding */ Select)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material_TextField__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material/TextField */ "./node_modules/@mui/material/esm/TextField/TextField.js");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @mui/material/styles */ "./node_modules/@mui/material/esm/styles/styled.js");
/* harmony import */ var _LightTooltip__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./LightTooltip */ "./lib/components/LightTooltip.js");
// /*
//  * Copyright 2020 The Kale Authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// import * as React from 'react';
// import TextField, { BaseTextFieldProps } from '@mui/material/TextField';
// import { MenuItem, Zoom } from '@mui/material';
// import { createStyles, makeStyles } from '@mui/material/styles';
// import { styled } from '@mui/material/styles'; 
// import { LightTooltip } from './LightTooltip';
// export interface ISelectOption {
//   label: string;
//   value: string;
//   tooltip?: any;
//   invalid?: boolean;
// }
// const useStyles = styled(TextField)({
//   label: {
//     color: 'var(--jp-input-border-color)',
//     fontSize: 'var(--jp-ui-font-size2)',
//   },
//   input: {
//     color: 'var(--jp-ui-font-color1)',
//   },
//   textField: {
//     width: '100%',
//   },
//   menu: {
//     backgroundColor: 'var(--jp-layout-color1)',
//     color: 'var(--jp-ui-font-color1)',
//   },
//   helperLabel: {
//     color: 'var(--jp-info-color0)',
//   },
// });
// interface SelectProps extends BaseTextFieldProps {
//   index: number;
//   values: ISelectOption[];
//   variant?: 'filled' | 'standard' | 'outlined';
//   updateValue: Function;
// }
// export const Select: React.FC<SelectProps> = props => {
//   const classes = useStyles({});
//   const {
//     index,
//     value,
//     values,
//     helperText = null,
//     variant = 'outlined',
//     updateValue,
//     ...rest
//   } = props;
//   const disableMenuItem = (event: React.MouseEvent, invalidOption: boolean) => {
//     if (invalidOption) {
//       event.stopPropagation();
//     }
//   };
//   const getOptionClassNames = (option: any) => {
//     const classNames: string[] = [];
//     if (option.tooltip) {
//       classNames.push('menu-item-tooltip');
//     }
//     return classNames.join(' ');
//   };
//   return (
//     // @ts-ignore
//     <TextField
//       select
//       {...rest}
//       margin="dense"
//       value={value}
//       variant={variant}
//       className={classes.textField}
//       onChange={evt =>
//         updateValue((evt.target as HTMLInputElement).value, index)
//       }
//       InputLabelProps={{
//         classes: { root: classes.label },
//         shrink: value !== '',
//       }}
//       InputProps={{ classes: { root: classes.input } }}
//       SelectProps={{ MenuProps: { PaperProps: { className: classes.menu } } }}
//       FormHelperTextProps={{ classes: { root: classes.helperLabel } }}
//     >
//       {values.map((option: any) => (
//         <MenuItem
//           key={option.value}
//           value={option.value}
//           disabled={!!option.invalid}
//           className={getOptionClassNames(option)}
//         >
//           {option.tooltip ? (
//             <LightTooltip
//               title={option.tooltip}
//               placement="top-start"
//               interactive={!(typeof option.tooltip === 'string')}
//               TransitionComponent={Zoom}
//             >
//               <div
//                 className="menu-item-label"
//                 onClick={ev => disableMenuItem(ev, !!option.invalid)}
//               >
//                 {option.label}
//               </div>
//             </LightTooltip>
//           ) : (
//             option.label
//           )}
//         </MenuItem>
//       ))}
//     </TextField>
//   );
// };





// Styled TextField component with custom CSS variables
const StyledTextField = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_3__["default"])(_mui_material_TextField__WEBPACK_IMPORTED_MODULE_1__["default"])(({ theme }) => ({
    width: '100%',
    '& .MuiInputLabel-root': {
        color: 'var(--jp-input-border-color)',
        fontSize: 'var(--jp-ui-font-size2)',
    },
    '& .MuiInputBase-input': {
        color: 'var(--jp-ui-font-color1)',
    },
    '& .MuiFormHelperText-root': {
        color: 'var(--jp-info-color0)',
    },
    '& .MuiPaper-root': {
        backgroundColor: 'var(--jp-layout-color1)',
        color: 'var(--jp-ui-font-color1)',
    },
}));
const Select = (props) => {
    const { index, value, values, helperText = null, variant = 'outlined', updateValue, ...rest } = props;
    const disableMenuItem = (event, invalidOption) => {
        if (invalidOption) {
            event.stopPropagation();
        }
    };
    const getOptionClassNames = (option) => {
        const classNames = [];
        if (option.tooltip) {
            classNames.push('menu-item-tooltip');
        }
        return classNames.join(' ');
    };
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(StyledTextField, { select: true, ...rest, margin: "dense", value: value || '', variant: variant, helperText: helperText, onChange: (evt) => updateValue(evt.target.value, index), InputLabelProps: {
            shrink: value !== '',
        }, slotProps: {
            select: {
                MenuProps: {
                    PaperProps: {
                        sx: {
                            backgroundColor: 'var(--jp-layout-color1)',
                            color: 'var(--jp-ui-font-color1)',
                        },
                    },
                },
            },
        } }, values.map((option) => (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_2__.MenuItem, { key: option.value, value: option.value, disabled: !!option.invalid, className: getOptionClassNames(option) }, option.tooltip ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_LightTooltip__WEBPACK_IMPORTED_MODULE_4__.LightTooltip, { title: option.tooltip, placement: "top-start", TransitionComponent: _mui_material__WEBPACK_IMPORTED_MODULE_2__.Zoom, slotProps: {
            popper: {
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, -14],
                        },
                    },
                ],
            },
        } },
        react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "menu-item-label", onClick: (ev) => disableMenuItem(ev, !!option.invalid) }, option.label))) : (option.label))))));
};


/***/ }),

/***/ "./lib/components/SelectMulti.js":
/*!***************************************!*\
  !*** ./lib/components/SelectMulti.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SelectMulti: () => (/* binding */ SelectMulti)
/* harmony export */ });
/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @mui/material/styles */ "./node_modules/@mui/material/esm/styles/styled.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _mui_material_OutlinedInput__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @mui/material/OutlinedInput */ "./node_modules/@mui/material/esm/OutlinedInput/OutlinedInput.js");
/* harmony import */ var _mui_material_FormControl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @mui/material/FormControl */ "./node_modules/@mui/material/esm/FormControl/FormControl.js");
/* harmony import */ var _mui_material_InputLabel__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @mui/material/InputLabel */ "./node_modules/@mui/material/esm/InputLabel/InputLabel.js");
/* harmony import */ var _mui_material_Chip__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @mui/material/Chip */ "./node_modules/@mui/material/esm/Chip/Chip.js");
/* harmony import */ var _lib_ColorUtils__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../lib/ColorUtils */ "./lib/lib/ColorUtils.js");
// /*
//  * Copyright 2020 The Kale Authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// import { createStyles, makeStyles } from '@mui/material/styles';
// import * as React from 'react';
// import { findDOMNode } from 'react-dom';
// import { Input, MenuItem, Select } from '@mui/material';
// import OutlinedInput from '@mui/material/OutlinedInput';
// import FormControl from '@mui/material/FormControl';
// import InputLabel from '@mui/material/InputLabel';
// import Chip from '@mui/material/Chip';
// import ColorUtils from '../lib/ColorUtils';
// const useStyles = makeStyles(() =>
//   createStyles({
//     menu: {
//       color: 'var(--jp-ui-font-color1)',
//       fontSize: 'var(--jp-ui-font-size2)',
//     },
//     chips: {
//       display: 'flex',
//       flexWrap: 'wrap',
//     },
//     chip: {},
//     selectMultiForm: {
//       width: '100%',
//     },
//     label: {
//       backgroundColor: 'var(--jp-layout-color1)',
//       color: 'var(--jp-input-border-color)',
//       fontSize: 'var(--jp-ui-font-size2)',
//     },
//     input: {
//       fontSize: 'var(--jp-ui-font-size2)',
//     },
//   }),
// );
// interface SelectMultiProps {
//   id: string;
//   label: string;
//   style?: unknown;
//   selected: string[];
//   disabled?: boolean;
//   options: { value: string; color: string }[];
//   variant?: 'filled' | 'standard' | 'outlined';
//   updateSelected: Function;
// }
// export const SelectMulti: React.FunctionComponent<SelectMultiProps> = props => {
//   const classes = useStyles({});
//   const [inputLabelRef, setInputLabelRef] = React.useState(undefined);
//   const labelOffsetWidth = inputLabelRef
//     ? (findDOMNode(inputLabelRef) as HTMLElement).offsetWidth
//     : 0;
//   const {
//     id,
//     label,
//     options,
//     selected,
//     disabled = false,
//     variant = 'outlined',
//     style = {},
//     updateSelected,
//   } = props;
//   let inputComponent = <Input margin="dense" id={id} />;
//   if (!variant || variant === 'outlined') {
//     inputComponent = (
//       <OutlinedInput margin="dense" labelWidth={labelOffsetWidth} id={id} />
//     );
//   }
//   return (
//     <FormControl
//       margin="dense"
//       style={style}
//       variant={variant}
//       disabled={disabled}
//       className={classes.selectMultiForm}
//     >
//       <InputLabel
//         ref={ref => {
//           setInputLabelRef(ref);
//         }}
//         htmlFor={id}
//         className={classes.label}
//       >
//         {label}
//       </InputLabel>
//       <Select
//         multiple
//         MenuProps={{ PaperProps: { className: classes.menu } }}
//         onChange={evt => updateSelected((evt.target as HTMLInputElement).value)}
//         margin="dense"
//         variant={variant}
//         input={inputComponent}
//         value={selected}
//         renderValue={elements => (
//           <div className={classes.chips}>
//             {(elements as string[]).map(value => {
//               return (
//                 <Chip
//                   style={{ backgroundColor: `#${ColorUtils.getColor(value)}` }}
//                   key={value}
//                   label={value}
//                   className={`kale-chip kale-chip-select ${classes.chip}`}
//                 />
//               );
//             })}
//           </div>
//         )}
//       >
//         {options.map(option => (
//           <MenuItem key={option.value} value={option.value}>
//             {option.value}
//           </MenuItem>
//         ))}
//       </Select>
//     </FormControl>
//   );
// };








const StyledFormControl = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_0__["default"])(_mui_material_FormControl__WEBPACK_IMPORTED_MODULE_4__["default"])({
    width: '100%',
    '& .MuiInputLabel-root': {
        backgroundColor: 'var(--jp-layout-color1)',
        color: 'var(--jp-input-border-color)',
        fontSize: 'var(--jp-ui-font-size2)',
    },
    '& .MuiInputBase-input': {
        fontSize: 'var(--jp-ui-font-size2)',
    },
});
const ChipsContainer = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_0__["default"])('div')({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
});
const StyledChip = (0,_mui_material_styles__WEBPACK_IMPORTED_MODULE_0__["default"])(_mui_material_Chip__WEBPACK_IMPORTED_MODULE_6__["default"])({
// Additional chip styling can go here if needed
});
const SelectMulti = (props) => {
    const { id, label, options, selected, disabled = false, variant = 'outlined', style = {}, updateSelected, } = props;
    const getInputComponent = () => {
        if (variant === 'outlined') {
            return react__WEBPACK_IMPORTED_MODULE_1__.createElement(_mui_material_OutlinedInput__WEBPACK_IMPORTED_MODULE_3__["default"], { margin: "dense", id: id });
        }
        return react__WEBPACK_IMPORTED_MODULE_1__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_2__.Input, { margin: "dense", id: id });
    };
    return (react__WEBPACK_IMPORTED_MODULE_1__.createElement(StyledFormControl, { margin: "dense", style: style, variant: variant, disabled: disabled },
        react__WEBPACK_IMPORTED_MODULE_1__.createElement(_mui_material_InputLabel__WEBPACK_IMPORTED_MODULE_5__["default"], { htmlFor: id }, label),
        react__WEBPACK_IMPORTED_MODULE_1__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_2__.Select, { multiple: true, value: selected, onChange: (evt) => updateSelected(evt.target.value), input: getInputComponent(), MenuProps: {
                PaperProps: {
                    sx: {
                        color: 'var(--jp-ui-font-color1)',
                        fontSize: 'var(--jp-ui-font-size2)',
                    },
                },
            }, renderValue: (selectedValues) => (react__WEBPACK_IMPORTED_MODULE_1__.createElement(ChipsContainer, null, selectedValues.map((value) => (react__WEBPACK_IMPORTED_MODULE_1__.createElement(StyledChip, { key: value, label: value, className: "kale-chip kale-chip-select", sx: {
                    backgroundColor: `#${_lib_ColorUtils__WEBPACK_IMPORTED_MODULE_7__["default"].getColor(value)}`,
                } }))))) }, options.map((option) => (react__WEBPACK_IMPORTED_MODULE_1__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_2__.MenuItem, { key: option.value, value: option.value }, option.value))))));
};


/***/ }),

/***/ "./lib/icons/statusRunning.js":
/*!************************************!*\
  !*** ./lib/icons/statusRunning.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ StatusRunning)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/*
 * Copyright 2019-2020 The Kale Authors
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

// import { CSSProperties } from 'jss/css';
class StatusRunning extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    render() {
        const { style } = this.props;
        return (react__WEBPACK_IMPORTED_MODULE_0__.createElement("svg", { width: style.width, height: style.height, viewBox: "0 0 18 18" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("g", { transform: "translate(-450, -307)", fill: style.color, fillRule: "nonzero" },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("g", { transform: "translate(450, 266)" },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("g", { transform: "translate(0, 41)" },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement("path", { d: "M9,4 C6.23857143,4 4,6.23857143 4,9 C4,11.7614286 6.23857143,14 9,14\r\n                C11.7614286,14 14,11.7614286 14,9 C14,8.40214643 13.8950716,7.8288007\r\n                13.702626,7.29737398 L15.2180703,5.78192967 C15.7177126,6.74539838\r\n                16,7.83973264 16,9 C16,12.866 12.866,16 9,16 C5.134,16 2,12.866 2,9 C2,5.134\r\n                5.134,2 9,2 C10.933,2 12.683,2.7835 13.94975,4.05025 L12.7677679,5.23223214\r\n                L9,9 L9,4 Z" }))))));
    }
}


/***/ }),

/***/ "./lib/icons/statusTerminated.js":
/*!***************************************!*\
  !*** ./lib/icons/statusTerminated.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ StatusTerminated)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/*
 * Copyright 2019-2020 The Kale Authors
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

// import { CSSProperties } from 'jss/css';
class StatusTerminated extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    render() {
        const { style } = this.props;
        return (react__WEBPACK_IMPORTED_MODULE_0__.createElement("svg", { width: style.width, height: style.height, viewBox: "0 0 18 18" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("g", { stroke: "none", strokeWidth: "1", fill: "none", fillRule: "evenodd" },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("g", null,
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("polygon", { points: "0 0 18 0 18 18 0 18" }),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("path", { d: "M8.9925,1.5 C4.8525,1.5 1.5,4.86 1.5,9 C1.5,13.14 4.8525,16.5 8.9925,16.5\r\n              C13.14,16.5 16.5,13.14 16.5,9 C16.5,4.86 13.14,1.5 8.9925,1.5 Z M9,15 C5.685,15\r\n              3,12.315 3,9 C3,5.685 5.685,3 9,3 C12.315,3 15,5.685 15,9 C15,12.315 12.315,15 9,15 Z", fill: style.color, fillRule: "nonzero" }),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("polygon", { fill: style.color, fillRule: "nonzero", points: "6 6 12 6 12 12 6 12" })))));
    }
}


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _widget__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./widget */ "./lib/widget.js");
/*
 * Copyright 2019-2020 The Kale Authors
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ([_widget__WEBPACK_IMPORTED_MODULE_0__["default"]]);


/***/ }),

/***/ "./lib/lib/CellMetadataContext.js":
/*!****************************************!*\
  !*** ./lib/lib/CellMetadataContext.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CellMetadataContext: () => (/* binding */ CellMetadataContext)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
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

const CellMetadataContext = react__WEBPACK_IMPORTED_MODULE_0__.createContext({
    isEditorVisible: false,
    activeCellIndex: -1,
    onEditorVisibilityChange: (isEditorVisible) => { },
});


/***/ }),

/***/ "./lib/lib/CellUtils.js":
/*!******************************!*\
  !*** ./lib/lib/CellUtils.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CellUtilities)
/* harmony export */ });
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/cells */ "webpack/sharing/consume/default/@jupyterlab/cells");
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/nbformat */ "webpack/sharing/consume/default/@jupyterlab/nbformat");
/* harmony import */ var _jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _NotebookUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./NotebookUtils */ "./lib/lib/NotebookUtils.js");
// /*
//  * Copyright 2019-2020 The Kale Authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// // Dependencies
// import { Cell, ICellModel, isCodeCellModel } from '@jupyterlab/cells';
// import {
//   IError,
//   isError,
//   isExecuteResult,
//   isStream,
// } from '@jupyterlab/nbformat';
// import { Notebook, NotebookActions, NotebookPanel } from '@jupyterlab/notebook';
// // Project Components
// import NotebookUtilities from './NotebookUtils';
// /** Contains some utility functions for handling notebook cells */
// export default class CellUtilities {
//   /**
//    * @description Reads the output at a cell within the specified notebook and returns it as a string
//    * @param notebook The notebook to get the cell from
//    * @param index The index of the cell to read
//    * @returns any - A string value of the cell output from the specified
//    * notebook and cell index, or null if there is no output.
//    * @throws An error message if there are issues in getting the output
//    */
//   public static readOutput(notebook: Notebook, index: number): any {
//     if (!notebook) {
//       throw new Error('Notebook was null!');
//     }
//     if (index < 0 || index >= notebook.model.cells.length) {
//       throw new Error('Cell index out of range.');
//     }
//     const cell: ICellModel = notebook.model.cells.get(index);
//     if (!isCodeCellModel(cell)) {
//       throw new Error('cell is not a code cell.');
//     }
//     if (cell.outputs.length < 1) {
//       return null;
//     }
//     const out = cell.outputs.toJSON().pop();
//     if (isExecuteResult(out)) {
//       return out.data['text/plain'];
//     }
//     if (isStream(out)) {
//       return out.text;
//     }
//     if (isError(out)) {
//       const errData: IError = out;
//       throw new Error(
//         `Code resulted in errors. Error name: ${errData.ename}.\nMessage: ${errData.evalue}.`,
//       );
//     }
//   }
//   /**
//    * @description Gets the value of a key from the specified cell's metadata.
//    * @param notebook The notebook that contains the cell.
//    * @param index The index of the cell.
//    * @param key The key of the value.
//    * @returns any - The value of the metadata. Returns null if the key doesn't exist.
//    */
//   public static getCellMetaData(
//     notebook: Notebook,
//     index: number,
//     key: string,
//   ): any {
//     if (!notebook) {
//       throw new Error('Notebook was null!');
//     }
//     if (index < 0 || index >= notebook.model.cells.length) {
//       throw new Error('Cell index out of range.');
//     }
//     const cell: ICellModel = notebook.model.cells.get(index);
//     if (cell.metadata.has(key)) {
//       return cell.metadata.get(key);
//     }
//     return null;
//   }
//   /**
//    * @description Sets the key value pair in the notebook's metadata.
//    * If the key doesn't exists it will add one.
//    * @param notebookPanel The notebook to set meta data in.
//    * @param index: The cell index to read metadata from
//    * @param key The key of the value to create.
//    * @param value The value to set.
//    * @param save Default is false. Whether the notebook should be saved after the meta data is set.
//    * Note: This function will not wait for the save to complete, it only sends a save request.
//    * @returns any - The old value for the key, or undefined if it did not exist.
//    */
//   public static setCellMetaData(
//     notebookPanel: NotebookPanel,
//     index: number,
//     key: string,
//     value: any,
//     save: boolean = false,
//   ): Promise<any> {
//     if (!notebookPanel) {
//       throw new Error('Notebook was null!');
//     }
//     if (index < 0 || index >= notebookPanel.model.cells.length) {
//       throw new Error('Cell index out of range.');
//     }
//     try {
//       const cell: ICellModel = notebookPanel.model.cells.get(index);
//       const oldVal: any = cell.metadata.set(key, value);
//       if (save) {
//         return notebookPanel.context.save();
//       }
//       return Promise.resolve(oldVal);
//     } catch (error) {
//       return Promise.reject(error);
//     }
//   }
//   /**
//    * @description Looks within the notebook for a cell containing the specified meta key
//    * @param notebook The notebook to search in
//    * @param key The metakey to search for
//    * @returns [number, ICellModel] - A pair of values, the first is the index of where the cell was found
//    * and the second is a reference to the cell itself. Returns [-1, null] if cell not found.
//    */
//   public static findCellWithMetaKey(
//     notebookPanel: NotebookPanel,
//     key: string,
//   ): [number, ICellModel] {
//     if (!notebookPanel) {
//       throw new Error('Notebook was null!');
//     }
//     const cells = notebookPanel.model.cells;
//     let cell: ICellModel;
//     for (let idx = 0; idx < cells.length; idx += 1) {
//       cell = cells.get(idx);
//       if (cell.metadata.has(key)) {
//         return [idx, cell];
//       }
//     }
//     return [-1, null];
//   }
//   /**
//    * @description Gets the cell object at specified index in the notebook.
//    * @param notebook The notebook to get the cell from
//    * @param index The index for the cell
//    * @returns Cell - The cell at specified index, or null if not found
//    */
//   public static getCell(notebook: Notebook, index: number): ICellModel {
//     if (notebook && index >= 0 && index < notebook.model.cells.length) {
//       return notebook.model.cells.get(index);
//     }
//     return null;
//   }
//   /**
//    * @description Runs code in the notebook cell found at the given index.
//    * @param command The command registry which can execute the run command.
//    * @param notebook The notebook panel to run the cell in
//    * @returns Promise<string> - A promise containing the output after the code has executed.
//    */
//   public static async runCellAtIndex(
//     notebookPanel: NotebookPanel,
//     index: number,
//   ): Promise<string> {
//     if (notebookPanel === null) {
//       throw new Error(
//         'Null or undefined parameter was given for command or notebook argument.',
//       );
//     }
//     const notebook = notebookPanel.content;
//     if (index < 0 || index >= notebook.widgets.length) {
//       throw new Error('The index was out of range.');
//     }
//     // Save the old index, then set the current active cell
//     const oldIndex = notebook.activeCellIndex;
//     notebook.activeCellIndex = index;
//     try {
//       await NotebookActions.run(notebook, notebookPanel.sessionContext);
//       // await command.execute("notebook:run-cell");
//       const output = CellUtilities.readOutput(notebook, index);
//       notebook.activeCellIndex = oldIndex;
//       return output;
//     } finally {
//       notebook.activeCellIndex = oldIndex;
//     }
//   }
//   /**
//    * @description Deletes the cell at specified index in the open notebook
//    * @param notebookPanel The notebook panel to delete the cell from
//    * @param index The index that the cell will be deleted at
//    * @returns void
//    */
//   public static deleteCellAtIndex(notebook: Notebook, index: number): void {
//     if (notebook === null) {
//       throw new Error(
//         'Null or undefined parameter was given for notebook argument.',
//       );
//     }
//     if (index < 0 || index >= notebook.widgets.length) {
//       throw new Error('The index was out of range.');
//     }
//     // Save the old index, then set the current active cell
//     let oldIndex = notebook.activeCellIndex;
//     notebook.model.cells.remove(index);
//     // Adjust old index to account for deleted cell.
//     if (oldIndex === index) {
//       if (oldIndex > 0) {
//         oldIndex -= 1;
//       } else {
//         oldIndex = 0;
//       }
//     } else if (oldIndex > index) {
//       oldIndex -= 1;
//     }
//     notebook.activeCellIndex = oldIndex;
//   }
//   /**
//    * @description Inserts a cell into the notebook, the new cell will be at the specified index.
//    * @param notebook The notebook panel to insert the cell in
//    * @param index The index of where the new cell will be inserted.
//    * If the cell index is less than or equal to 0, it will be added at the top.
//    * If the cell index is greater than the last index, it will be added at the bottom.
//    * @returns number - The index it where the cell was inserted
//    */
//   public static insertCellAtIndex(notebook: Notebook, index: number): number {
//     // Create a new cell
//     const cell = notebook.model.contentFactory.createCodeCell({});
//     // Save the old index, then set the current active cell
//     let oldIndex = notebook.activeCellIndex;
//     // Adjust old index for cells inserted above active cell.
//     if (oldIndex >= index) {
//       oldIndex += 1;
//     }
//     if (index <= 0) {
//       notebook.model.cells.insert(0, cell);
//       notebook.activeCellIndex = oldIndex;
//       return 0;
//     }
//     if (index >= notebook.widgets.length) {
//       notebook.model.cells.insert(notebook.widgets.length - 1, cell);
//       notebook.activeCellIndex = oldIndex;
//       return notebook.widgets.length - 1;
//     }
//     notebook.model.cells.insert(index, cell);
//     notebook.activeCellIndex = oldIndex;
//     return index;
//   }
//   /**
//    * @description Injects code into the specified cell of a notebook, does not run the code.
//    * Warning: the existing cell's code/text will be overwritten.
//    * @param notebook The notebook to select the cell from
//    * @param index The index of the cell to inject the code into
//    * @param code A string containing the code to inject into the CodeCell.
//    * @throws An error message if there are issues with injecting code at a particular cell
//    * @returns void
//    */
//   public static injectCodeAtIndex(
//     notebook: Notebook,
//     index: number,
//     code: string,
//   ): void {
//     if (notebook === null) {
//       throw new Error('Notebook was null or undefined.');
//     }
//     if (index < 0 || index >= notebook.model.cells.length) {
//       throw new Error('Cell index out of range.');
//     }
//     const cell: ICellModel = notebook.model.cells.get(index);
//     if (isCodeCellModel(cell)) {
//       cell.value.text = code;
//       return;
//     }
//     throw new Error('Cell is not a code cell.');
//   }
//   /**
//    * @description This will insert a new cell at the specified index and the inject the specified code into it.
//    * @param notebook The notebook to insert the cell into
//    * @param index The index of where the new cell will be inserted.
//    * If the cell index is less than or equal to 0, it will be added at the top.
//    * If the cell index is greater than the last index, it will be added at the bottom.
//    * @param code The code to inject into the cell after it has been inserted
//    * @returns number - index of where the cell was inserted
//    */
//   public static insertInjectCode(
//     notebook: Notebook,
//     index: number,
//     code: string,
//   ): number {
//     const newIndex = CellUtilities.insertCellAtIndex(notebook, index);
//     CellUtilities.injectCodeAtIndex(notebook, newIndex, code);
//     return newIndex;
//   }
//   /**
//    * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
//    * Note: The code will be run but the results (output or errors) will not be displayed in the cell. Best for void functions.
//    * @param notebookPanel The notebook to insert the cell into
//    * @param index The index of where the new cell will be inserted and run.
//    * If the cell index is less than or equal to 0, it will be added at the top.
//    * If the cell index is greater than the last index, it will be added at the bottom.
//    * @param code The code to inject into the cell after it has been inserted
//    * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
//    * @returns Promise<[number, string]> - A promise for when the cell code has executed
//    * containing the cell's index and output result
//    */
//   public static async insertAndRun(
//     notebookPanel: NotebookPanel,
//     index: number,
//     code: string,
//     deleteOnError: boolean,
//   ): Promise<[number, string]> {
//     let insertionIndex;
//     try {
//       insertionIndex = CellUtilities.insertInjectCode(
//         notebookPanel.content,
//         index,
//         code,
//       );
//       const output: string = await NotebookUtilities.sendKernelRequestFromNotebook(
//         notebookPanel,
//         code,
//         { output: 'output' },
//         false,
//       );
//       return [insertionIndex, output];
//     } catch (error) {
//       if (deleteOnError) {
//         CellUtilities.deleteCellAtIndex(notebookPanel.content, insertionIndex);
//       }
//       throw error;
//     }
//   }
//   /**
//    * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
//    * Note: The code will be run and the result (output or errors) WILL BE DISPLAYED in the cell.
//    * @param notebookPanel The notebook to insert the cell into
//    * @param command The command registry which can execute the run command.
//    * @param index The index of where the new cell will be inserted and run.
//    * If the cell index is less than or equal to 0, it will be added at the top.
//    * If the cell index is greater than the last index, it will be added at the bottom.
//    * @param code The code to inject into the cell after it has been inserted
//    * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
//    * @returns Promise<[number, string]> - A promise for when the cell code has executed
//    * containing the cell's index and output result
//    */
//   public static async insertRunShow(
//     notebookPanel: NotebookPanel,
//     index: number,
//     code: string,
//     deleteOnError: boolean,
//   ): Promise<[number, string]> {
//     let insertionIndex;
//     try {
//       insertionIndex = CellUtilities.insertInjectCode(
//         notebookPanel.content,
//         index,
//         code,
//       );
//       const output: string = await CellUtilities.runCellAtIndex(
//         notebookPanel,
//         insertionIndex,
//       );
//       return [insertionIndex, output];
//     } catch (error) {
//       if (deleteOnError) {
//         CellUtilities.deleteCellAtIndex(notebookPanel.content, insertionIndex);
//       }
//       throw error;
//     }
//   }
//   /**
//    * @deprecated Using NotebookUtilities.sendSimpleKernelRequest or NotebookUtilities.sendKernelRequest
//    * will execute code directly in the kernel without the need to create a cell and delete it.
//    * @description This will insert a cell with specified code at the top and run the code.
//    * Once the code is run and output received, the cell is deleted, giving back cell's output.
//    * If the code results in an error, the injected cell is still deleted but the promise will be rejected.
//    * @param notebookPanel The notebook to run the code in
//    * @param code The code to run in the cell
//    * @param insertAtEnd True means the cell will be inserted at the bottom
//    * @returns Promise<string> - A promise when the cell has been deleted, containing the execution result as a string
//    */
//   public static async runAndDelete(
//     notebookPanel: NotebookPanel,
//     code: string,
//     insertAtEnd = true,
//   ): Promise<string> {
//     let idx: number = -1;
//     if (insertAtEnd) {
//       idx = notebookPanel.content.model.cells.length;
//     }
//     const [index, result]: [number, string] = await CellUtilities.insertAndRun(
//       notebookPanel,
//       idx,
//       code,
//       true,
//     );
//     CellUtilities.deleteCellAtIndex(notebookPanel.content, index);
//     return result;
//   }
//   public static getStepName(notebook: NotebookPanel, index: number): string {
//     const names: string[] = (
//       this.getCellMetaData(notebook.content, index, 'tags') || []
//     )
//       .filter((t: string) => !t.startsWith('prev:'))
//       .map((t: string) => t.replace('block:', ''));
//     return names.length > 0 ? names[0] : '';
//   }
//   public static getCellByStepName(
//     notebook: NotebookPanel,
//     stepName: string,
//   ): { cell: Cell; index: number } {
//     for (let i = 0; i < notebook.model.cells.length; i++) {
//       const name = this.getStepName(notebook, i);
//       if (name === stepName) {
//         return { cell: notebook.content.widgets[i], index: i };
//       }
//     }
//   }
// }
/*
 * Copyright 2019-2020 The Kale Authors
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
// Dependencies



// Project Components

/** Contains some utility functions for handling notebook cells */
class CellUtilities {
    /**
     * @description Reads the output at a cell within the specified notebook and returns it as a string
     * @param notebook The notebook to get the cell from
     * @param index The index of the cell to read
     * @returns any - A string value of the cell output from the specified
     * notebook and cell index, or null if there is no output.
     * @throws An error message if there are issues in getting the output
     */
    static readOutput(notebook, index) {
        if (!notebook || !notebook.model) {
            throw new Error('Notebook was null!');
        }
        if (index < 0 || index >= notebook.model.cells.length) {
            throw new Error('Cell index out of range.');
        }
        const cell = notebook.model.cells.get(index);
        if (!(0,_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_0__.isCodeCellModel)(cell)) {
            throw new Error('cell is not a code cell.');
        }
        if (cell.outputs.length < 1) {
            return null;
        }
        const out = cell.outputs.toJSON().pop();
        if ((0,_jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_1__.isExecuteResult)(out)) {
            return out.data['text/plain'];
        }
        if ((0,_jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_1__.isStream)(out)) {
            return out.text;
        }
        if ((0,_jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_1__.isError)(out)) {
            const errData = out;
            throw new Error(`Code resulted in errors. Error name: ${errData.ename}.\nMessage: ${errData.evalue}.`);
        }
    }
    /**
     * @description Gets the value of a key from the specified cell's metadata.
     * @param notebook The notebook that contains the cell.
     * @param index The index of the cell.
     * @param key The key of the value.
     * @returns any - The value of the metadata. Returns null if the key doesn't exist.
     */
    static getCellMetaData(notebook, index, key) {
        if (!notebook || !notebook.model) {
            throw new Error('Notebook was null!');
        }
        if (index < 0 || index >= notebook.model.cells.length) {
            throw new Error('Cell index out of range.');
        }
        const cell = notebook.model.cells.get(index);
        // Safe metadata access
        const metadata = cell.metadata;
        if (metadata && typeof metadata.get === 'function' && metadata.has && metadata.has(key)) {
            return metadata.get(key);
        }
        else if (metadata && metadata[key] !== undefined) {
            return metadata[key];
        }
        return null;
    }
    /**
     * @description Sets the key value pair in the notebook's metadata.
     * If the key doesn't exists it will add one.
     * @param notebookPanel The notebook to set meta data in.
     * @param index: The cell index to read metadata from
     * @param key The key of the value to create.
     * @param value The value to set.
     * @param save Default is false. Whether the notebook should be saved after the meta data is set.
     * Note: This function will not wait for the save to complete, it only sends a save request.
     * @returns any - The old value for the key, or undefined if it did not exist.
     */
    static setCellMetaData(notebookPanel, index, key, value, save = false) {
        if (!notebookPanel || !notebookPanel.model) {
            throw new Error('Notebook was null!');
        }
        if (index < 0 || index >= notebookPanel.model.cells.length) {
            throw new Error('Cell index out of range.');
        }
        try {
            const cell = notebookPanel.model.cells.get(index);
            const metadata = cell.metadata;
            let oldVal;
            // Safe metadata setting
            if (metadata && typeof metadata.set === 'function') {
                oldVal = metadata.set(key, value);
            }
            else if (metadata) {
                oldVal = metadata[key];
                metadata[key] = value;
            }
            if (save) {
                return notebookPanel.context.save();
            }
            return Promise.resolve(oldVal);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    /**
     * @description Looks within the notebook for a cell containing the specified meta key
     * @param notebook The notebook to search in
     * @param key The metakey to search for
     * @returns [number, ICellModel] - A pair of values, the first is the index of where the cell was found
     * and the second is a reference to the cell itself. Returns [-1, null] if cell not found.
     */
    static findCellWithMetaKey(notebookPanel, key) {
        if (!notebookPanel || !notebookPanel.model) {
            throw new Error('Notebook was null!');
        }
        const cells = notebookPanel.model.cells;
        let cell;
        for (let idx = 0; idx < cells.length; idx += 1) {
            cell = cells.get(idx);
            const metadata = cell.metadata;
            // Safe metadata checking
            const hasKey = (metadata && typeof metadata.has === 'function')
                ? metadata.has(key)
                : metadata && metadata[key] !== undefined;
            if (hasKey) {
                return [idx, cell];
            }
        }
        return [-1, null];
    }
    /**
     * @description Gets the cell object at specified index in the notebook.
     * @param notebook The notebook to get the cell from
     * @param index The index for the cell
     * @returns Cell - The cell at specified index, or null if not found
     */
    static getCell(notebook, index) {
        if (notebook && notebook.model && index >= 0 && index < notebook.model.cells.length) {
            return notebook.model.cells.get(index);
        }
        return null;
    }
    /**
     * @description Runs code in the notebook cell found at the given index.
     * @param command The command registry which can execute the run command.
     * @param notebook The notebook panel to run the cell in
     * @returns Promise<string> - A promise containing the output after the code has executed.
     */
    static async runCellAtIndex(notebookPanel, index) {
        if (notebookPanel === null) {
            throw new Error('Null or undefined parameter was given for command or notebook argument.');
        }
        const notebook = notebookPanel.content;
        if (index < 0 || index >= notebook.widgets.length) {
            throw new Error('The index was out of range.');
        }
        // Save the old index, then set the current active cell
        const oldIndex = notebook.activeCellIndex;
        notebook.activeCellIndex = index;
        try {
            await _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2__.NotebookActions.run(notebook, notebookPanel.sessionContext);
            // await command.execute("notebook:run-cell");
            const output = CellUtilities.readOutput(notebook, index);
            notebook.activeCellIndex = oldIndex;
            return output;
        }
        finally {
            notebook.activeCellIndex = oldIndex;
        }
    }
    /**
     * @description Deletes the cell at specified index in the open notebook
     * @param notebookPanel The notebook panel to delete the cell from
     * @param index The index that the cell will be deleted at
     * @returns void
     */
    static deleteCellAtIndex(notebook, index) {
        if (notebook === null || !notebook.model) {
            throw new Error('Null or undefined parameter was given for notebook argument.');
        }
        if (index < 0 || index >= notebook.widgets.length) {
            throw new Error('The index was out of range.');
        }
        // Save the old index, then set the current active cell
        let oldIndex = notebook.activeCellIndex;
        // Use NotebookActions to delete the cell properly
        notebook.activeCellIndex = index;
        _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2__.NotebookActions.deleteCells(notebook);
        // Adjust old index to account for deleted cell.
        if (oldIndex === index) {
            if (oldIndex > 0) {
                oldIndex -= 1;
            }
            else {
                oldIndex = 0;
            }
        }
        else if (oldIndex > index) {
            oldIndex -= 1;
        }
        // Restore the active cell index
        if (oldIndex < notebook.widgets.length) {
            notebook.activeCellIndex = oldIndex;
        }
        else if (notebook.widgets.length > 0) {
            notebook.activeCellIndex = notebook.widgets.length - 1;
        }
    }
    /**
     * @description Inserts a cell into the notebook, the new cell will be at the specified index.
     * @param notebook The notebook panel to insert the cell in
     * @param index The index of where the new cell will be inserted.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @returns number - The index it where the cell was inserted
     */
    static insertCellAtIndex(notebook, index) {
        if (!notebook || !notebook.model) {
            throw new Error('Notebook model is null');
        }
        // Create a new cell - use different approaches based on available APIs
        let cell;
        const model = notebook.model;
        if (model.contentFactory && typeof model.contentFactory.createCodeCell === 'function') {
            // Old API
            cell = model.contentFactory.createCodeCell({});
        }
        else if (model.sharedModel && typeof model.sharedModel.createCell === 'function') {
            // New API
            cell = model.sharedModel.createCell('code');
        }
        else {
            // Fallback - try to create using notebook model methods
            try {
                cell = notebook.model.createCell('code');
            }
            catch (error) {
                throw new Error('Unable to create new cell: ' + error.message);
            }
        }
        // Save the old index, then set the current active cell
        let oldIndex = notebook.activeCellIndex;
        // Adjust old index for cells inserted above active cell.
        if (oldIndex >= index) {
            oldIndex += 1;
        }
        const cells = notebook.model.cells;
        if (index <= 0) {
            // Insert at beginning
            if (typeof cells.insert === 'function') {
                cells.insert(0, cell);
            }
            else if (typeof cells.insertAll === 'function') {
                cells.insertAll(0, [cell]);
            }
            else {
                // Fallback
                cells.unshift(cell);
            }
            notebook.activeCellIndex = oldIndex;
            return 0;
        }
        if (index >= notebook.widgets.length) {
            // Insert at end
            const insertIndex = notebook.widgets.length;
            if (typeof cells.insert === 'function') {
                cells.insert(insertIndex, cell);
            }
            else if (typeof cells.insertAll === 'function') {
                cells.insertAll(insertIndex, [cell]);
            }
            else {
                // Fallback
                cells.push(cell);
            }
            notebook.activeCellIndex = oldIndex;
            return insertIndex;
        }
        // Insert at specific index
        if (typeof cells.insert === 'function') {
            cells.insert(index, cell);
        }
        else if (typeof cells.insertAll === 'function') {
            cells.insertAll(index, [cell]);
        }
        else {
            // Fallback
            cells.splice(index, 0, cell);
        }
        notebook.activeCellIndex = oldIndex;
        return index;
    }
    /**
     * @description Injects code into the specified cell of a notebook, does not run the code.
     * Warning: the existing cell's code/text will be overwritten.
     * @param notebook The notebook to select the cell from
     * @param index The index of the cell to inject the code into
     * @param code A string containing the code to inject into the CodeCell.
     * @throws An error message if there are issues with injecting code at a particular cell
     * @returns void
     */
    static injectCodeAtIndex(notebook, index, code) {
        if (notebook === null || !notebook.model) {
            throw new Error('Notebook was null or undefined.');
        }
        if (index < 0 || index >= notebook.model.cells.length) {
            throw new Error('Cell index out of range.');
        }
        const cell = notebook.model.cells.get(index);
        if ((0,_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_0__.isCodeCellModel)(cell)) {
            // Handle different cell value APIs
            const codeCell = cell;
            if (codeCell.sharedModel && typeof codeCell.sharedModel.setSource === 'function') {
                // New API
                codeCell.sharedModel.setSource(code);
            }
            else if (codeCell.value && codeCell.value.text !== undefined) {
                // Old API
                codeCell.value.text = code;
            }
            else if (typeof codeCell.setSource === 'function') {
                // Alternative API
                codeCell.setSource(code);
            }
            else {
                // Fallback
                codeCell.source = code;
            }
            return;
        }
        throw new Error('Cell is not a code cell.');
    }
    /**
     * @description This will insert a new cell at the specified index and the inject the specified code into it.
     * @param notebook The notebook to insert the cell into
     * @param index The index of where the new cell will be inserted.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @param code The code to inject into the cell after it has been inserted
     * @returns number - index of where the cell was inserted
     */
    static insertInjectCode(notebook, index, code) {
        const newIndex = CellUtilities.insertCellAtIndex(notebook, index);
        CellUtilities.injectCodeAtIndex(notebook, newIndex, code);
        return newIndex;
    }
    /**
     * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
     * Note: The code will be run but the results (output or errors) will not be displayed in the cell. Best for void functions.
     * @param notebookPanel The notebook to insert the cell into
     * @param index The index of where the new cell will be inserted and run.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @param code The code to inject into the cell after it has been inserted
     * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
     * @returns Promise<[number, string]> - A promise for when the cell code has executed
     * containing the cell's index and output result
     */
    static async insertAndRun(notebookPanel, index, code, deleteOnError) {
        let insertionIndex;
        try {
            insertionIndex = CellUtilities.insertInjectCode(notebookPanel.content, index, code);
            const output = await _NotebookUtils__WEBPACK_IMPORTED_MODULE_3__["default"].sendKernelRequestFromNotebook(notebookPanel, code, { output: 'output' }, false);
            return [insertionIndex, output];
        }
        catch (error) {
            if (deleteOnError && insertionIndex !== undefined) {
                CellUtilities.deleteCellAtIndex(notebookPanel.content, insertionIndex);
            }
            throw error;
        }
    }
    /**
     * @description This will insert a new cell at the specified index, inject the specified code into it and the run the code.
     * Note: The code will be run and the result (output or errors) WILL BE DISPLAYED in the cell.
     * @param notebookPanel The notebook to insert the cell into
     * @param command The command registry which can execute the run command.
     * @param index The index of where the new cell will be inserted and run.
     * If the cell index is less than or equal to 0, it will be added at the top.
     * If the cell index is greater than the last index, it will be added at the bottom.
     * @param code The code to inject into the cell after it has been inserted
     * @param deleteOnError If set to true, the cell will be deleted if the code results in an error
     * @returns Promise<[number, string]> - A promise for when the cell code has executed
     * containing the cell's index and output result
     */
    static async insertRunShow(notebookPanel, index, code, deleteOnError) {
        let insertionIndex;
        try {
            insertionIndex = CellUtilities.insertInjectCode(notebookPanel.content, index, code);
            const output = await CellUtilities.runCellAtIndex(notebookPanel, insertionIndex);
            return [insertionIndex, output];
        }
        catch (error) {
            if (deleteOnError && insertionIndex !== undefined) {
                CellUtilities.deleteCellAtIndex(notebookPanel.content, insertionIndex);
            }
            throw error;
        }
    }
    /**
     * @deprecated Using NotebookUtilities.sendSimpleKernelRequest or NotebookUtilities.sendKernelRequest
     * will execute code directly in the kernel without the need to create a cell and delete it.
     * @description This will insert a cell with specified code at the top and run the code.
     * Once the code is run and output received, the cell is deleted, giving back cell's output.
     * If the code results in an error, the injected cell is still deleted but the promise will be rejected.
     * @param notebookPanel The notebook to run the code in
     * @param code The code to run in the cell
     * @param insertAtEnd True means the cell will be inserted at the bottom
     * @returns Promise<string> - A promise when the cell has been deleted, containing the execution result as a string
     */
    static async runAndDelete(notebookPanel, code, insertAtEnd = true) {
        let idx = -1;
        if (insertAtEnd && notebookPanel.content.model) {
            idx = notebookPanel.content.model.cells.length;
        }
        const [index, result] = await CellUtilities.insertAndRun(notebookPanel, idx, code, true);
        CellUtilities.deleteCellAtIndex(notebookPanel.content, index);
        return result;
    }
    static getStepName(notebook, index) {
        const names = (this.getCellMetaData(notebook.content, index, 'tags') || [])
            .filter((t) => !t.startsWith('prev:'))
            .map((t) => t.replace('block:', ''));
        return names.length > 0 ? names[0] : '';
    }
    static getCellByStepName(notebook, stepName) {
        if (!notebook.model) {
            return undefined;
        }
        for (let i = 0; i < notebook.model.cells.length; i++) {
            const name = this.getStepName(notebook, i);
            if (name === stepName) {
                return { cell: notebook.content.widgets[i], index: i };
            }
        }
        return undefined;
    }
}


/***/ }),

/***/ "./lib/lib/ColorUtils.js":
/*!*******************************!*\
  !*** ./lib/lib/ColorUtils.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ColorUtils)
/* harmony export */ });
/* harmony import */ var _widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../widgets/cell-metadata/CellMetadataEditor */ "./lib/widgets/cell-metadata/CellMetadataEditor.js");
/*
 * Copyright 2019-2020 The Kale Authors
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

const colorPool = [
    '#695181',
    '#F25D5D',
    '#7C74E4',
    '#E8DD53',
    '#EA9864',
    '#888888',
    '#50D3D4',
    '#B85DAE',
    '#489781',
    '#50A9D4',
];
class ColorUtils {
    static intToRGB(i) {
        const c = (i & 0x00ffffff).toString(16).toUpperCase();
        return '00000'.substring(0, 6 - c.length) + c;
    }
    static hashString(str) {
        // Append a random string in in order to prevent generation for similar
        // hashes from similar strings which will cause nearly identical colors in
        // UI
        str = str + 'pz8';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = char + (hash << 6) + (hash << 16) - hash;
        }
        return Math.abs(hash);
    }
    static getColorIndex(value) {
        return this.hashString(value) % colorPool.length;
    }
    static getColor(value) {
        if (!value) {
            return '';
        }
        if (value in _widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_0__.RESERVED_CELL_NAMES_CHIP_COLOR) {
            return _widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_0__.RESERVED_CELL_NAMES_CHIP_COLOR[value];
        }
        return this.intToRGB(this.hashString(value));
    }
}


/***/ }),

/***/ "./lib/lib/Commands.js":
/*!*****************************!*\
  !*** ./lib/lib/Commands.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Commands)
/* harmony export */ });
/* harmony import */ var _RPCUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./RPCUtils */ "./lib/lib/RPCUtils.js");
/* harmony import */ var _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../widgets/LeftPanel */ "./lib/widgets/LeftPanel.js");
/* harmony import */ var _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./NotebookUtils */ "./lib/lib/NotebookUtils.js");
/* harmony import */ var _CellUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./CellUtils */ "./lib/lib/CellUtils.js");
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




var RUN_CELL_STATUS;
(function (RUN_CELL_STATUS) {
    RUN_CELL_STATUS["OK"] = "ok";
    RUN_CELL_STATUS["ERROR"] = "error";
})(RUN_CELL_STATUS || (RUN_CELL_STATUS = {}));
// interface IKatibRunArgs {
//   pipeline_id: string;
//   version_id: string;
//   pipeline_metadata: any;
//   output_path: string;
// }
class Commands {
    constructor(notebook, kernel) {
        // snapshotNotebook = async () => {
        //   return await _legacy_executeRpcAndShowRPCError(
        //     this._notebook,
        //     this._kernel,
        //     'rok.snapshot_notebook',
        //   );
        // };
        // getSnapshotProgress = async (task_id: string, ms?: number) => {
        //   const task = await _legacy_executeRpcAndShowRPCError(
        //     this._notebook,
        //     this._kernel,
        //     'rok.get_task',
        //     {
        //       task_id,
        //     },
        //   );
        //   if (ms) {
        //     await wait(ms);
        //   }
        //   return task;
        // };
        // runSnapshotProcedure = async (onUpdate: Function) => {
        //   const showSnapshotProgress = true;
        //   const snapshot = await this.snapshotNotebook();
        //   const taskId = snapshot.task.id;
        //   let task = await this.getSnapshotProgress(taskId);
        //   onUpdate({ task, showSnapshotProgress });
        //   while (!['success', 'error', 'canceled'].includes(task.status)) {
        //     task = await this.getSnapshotProgress(taskId, 1000);
        //     onUpdate({ task });
        //   }
        //   if (task.status === 'success') {
        //     console.log('Snapshotting successful!');
        //     return task;
        //   } else if (task.status === 'error') {
        //     console.error('Snapshotting failed');
        //     console.error('Stopping the deployment...');
        //   } else if (task.status === 'canceled') {
        //     console.error('Snapshotting canceled');
        //     console.error('Stopping the deployment...');
        //   }
        //   return null;
        // };
        // replaceClonedVolumes = async (
        //   bucket: string,
        //   obj: string,
        //   version: string,
        //   volumes: IVolumeMetadata[],
        // ) => {
        //   return await _legacy_executeRpcAndShowRPCError(
        //     this._notebook,
        //     this._kernel,
        //     'rok.replace_cloned_volumes',
        //     {
        //       bucket,
        //       obj,
        //       version,
        //       volumes,
        //     },
        //   );
        // };
        // getMountedVolumes = async (currentNotebookVolumes: IVolumeMetadata[]) => {
        //   let notebookVolumes: IVolumeMetadata[] = await _legacy_executeRpcAndShowRPCError(
        //     this._notebook,
        //     this._kernel,
        //     'nb.list_volumes',
        //   );
        //   let availableVolumeTypes = SELECT_VOLUME_TYPES.map(t => {
        //     return t.value === 'snap' ? { ...t, invalid: false } : t;
        //   });
        //   if (notebookVolumes) {
        //     notebookVolumes = notebookVolumes.map(volume => {
        //       const size = volume.size ?? 0;
        //       const sizeGroup = SELECT_VOLUME_SIZE_TYPES.filter(
        //         s => size >= s.base,
        //       )[0];
        //       volume.size = Math.ceil(size / sizeGroup.base);
        //       volume.size_type = sizeGroup.value;
        //       volume.annotations = [];
        //       return volume;
        //     });
        //     availableVolumeTypes = availableVolumeTypes.map(t => {
        //       return t.value === 'clone' ? { ...t, invalid: false } : t;
        //     });
        //   } else {
        //     notebookVolumes = currentNotebookVolumes;
        //   }
        //   return {
        //     notebookVolumes,
        //     selectVolumeTypes: availableVolumeTypes,
        //   };
        // };
        this.unmarshalData = async (nbFileName) => {
            const cmd = `from kale.rpc.nb import unmarshal_data as __kale_rpc_unmarshal_data\n` +
                `locals().update(__kale_rpc_unmarshal_data("${nbFileName}"))`;
            console.log('Executing command: ' + cmd);
            await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].sendKernelRequestFromNotebook(this._notebook, cmd, {});
        };
        this.getBaseImage = async () => {
            let baseImage = null;
            try {
                baseImage = await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpc)(this._notebook, this._kernel, 'nb.get_base_image');
            }
            catch (error) {
                if (error instanceof _RPCUtils__WEBPACK_IMPORTED_MODULE_0__.RPCError) {
                    console.warn('Kale is not running in a Notebook Server', error.error);
                }
                else {
                    throw error;
                }
            }
            return baseImage;
        };
        this.getExperiments = async (experiment, experimentName) => {
            let experimentsList = await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'kfp.list_experiments');
            if (experimentsList) {
                experimentsList.push(_widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__.NEW_EXPERIMENT);
            }
            else {
                experimentsList = [_widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__.NEW_EXPERIMENT];
            }
            // Fix experiment metadata
            let newExperiment = null;
            let selectedExperiments = experimentsList.filter(e => e.id === experiment.id ||
                e.name === experiment.name ||
                e.name === experimentName);
            if (selectedExperiments.length === 0 ||
                selectedExperiments[0].id === _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__.NEW_EXPERIMENT.id) {
                let name = experimentsList[0].name;
                if (name === _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__.NEW_EXPERIMENT.name) {
                    name = experiment.name !== '' ? experiment.name : experimentName;
                }
                newExperiment = { ...experimentsList[0], name: name };
            }
            else {
                newExperiment = selectedExperiments[0];
            }
            return {
                experiments: experimentsList,
                experiment: newExperiment,
                experiment_name: newExperiment.name,
            };
        };
        // pollKatib(katibExperiment: IKatibExperiment, onUpdate: Function) {
        //   const getExperimentArgs: any = {
        //     experiment: katibExperiment.name,
        //     namespace: katibExperiment.namespace,
        //   };
        //   _legacy_executeRpcAndShowRPCError(
        //     this._notebook,
        //     this._kernel,
        //     'katib.get_experiment',
        //     getExperimentArgs,
        //   ).then(katib => {
        //     if (!katib) {
        //       // could not get the experiment
        //       onUpdate({ katib: { status: 'error' } });
        //       return;
        //     }
        //     onUpdate({ katib });
        //     if (katib && katib.status !== 'Succeeded' && katib.status !== 'Failed') {
        //       setTimeout(() => this.pollKatib(katibExperiment, onUpdate), 5000);
        //     }
        //   });
        // }
        this.validateMetadata = async (notebookPath, metadata, onUpdate) => {
            onUpdate({ showValidationProgress: true });
            const validateNotebookArgs = {
                source_notebook_path: notebookPath,
                notebook_metadata_overrides: metadata,
            };
            const validateNotebook = await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'nb.validate_notebook', validateNotebookArgs);
            if (!validateNotebook) {
                onUpdate({ notebookValidation: false });
                return false;
            }
            onUpdate({ notebookValidation: true });
            return true;
        };
        /**
         * Analyse the current metadata and produce some warning to be shown
         * under the compilation task
         * @param metadata Notebook metadata
         */
        this.getCompileWarnings = (metadata) => {
            let warningContent = [];
            // in case the notebook's docker base image is different than the default
            // one (e.g. the one detected in the Notebook Server), alert the user
            if (_widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__.DefaultState.metadata.docker_image !== '' &&
                metadata.docker_image !== _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__.DefaultState.metadata.docker_image) {
                warningContent.push('The image you used to create the notebook server is different ' +
                    'from the image you have selected for your pipeline.', '', 'Your Kubeflow pipeline will use the following image: <pre><b>' +
                    metadata.docker_image +
                    '</b></pre>', 'You created the notebook server using the following image: <pre><b>' +
                    _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_1__.DefaultState.metadata.docker_image +
                    '</b></pre>', '', "To use this notebook server's image as base image" +
                    ' for the pipeline steps, delete the existing docker image' +
                    ' from the Advanced Settings section.');
            }
            return warningContent;
        };
        // todo: docManager needs to be passed to deploysProgress during init
        // todo: autosnapshot will become part of metadata
        // todo: deployDebugMessage will be removed (the "Debug" toggle is of no use
        //  anymore
        this.compilePipeline = async (notebookPath, metadata, docManager, deployDebugMessage, onUpdate) => {
            // after parsing and validating the metadata, show warnings (if necessary)
            const compileWarnings = this.getCompileWarnings(metadata);
            onUpdate({ showCompileProgress: true, docManager: docManager });
            if (compileWarnings.length) {
                onUpdate({ compileWarnings });
            }
            const compileNotebookArgs = {
                source_notebook_path: notebookPath,
                notebook_metadata_overrides: metadata,
                debug: deployDebugMessage,
            };
            const compileNotebook = await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'nb.compile_notebook', compileNotebookArgs);
            if (!compileNotebook) {
                onUpdate({ compiledPath: 'error' });
                await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].showMessage('Operation Failed', [
                    'Could not compile pipeline.',
                ]);
            }
            else {
                // Pass to the deploy progress the path to the generated py script:
                // compileNotebook is the name of the tar package, that generated in the
                // workdir. Instead, the python script has a slightly different name and
                // is generated in the same directory where the notebook lives.
                onUpdate({
                    compiledPath: compileNotebook.pipeline_package_path.replace('pipeline.yaml', 'kale.py'),
                });
            }
            return compileNotebook;
        };
        this.uploadPipeline = async (compiledPackagePath, compiledPipelineMetadata, onUpdate) => {
            onUpdate({ showUploadProgress: true });
            const uploadPipelineArgs = {
                pipeline_package_path: compiledPackagePath,
                pipeline_metadata: compiledPipelineMetadata,
            };
            let uploadPipeline = await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'kfp.upload_pipeline', uploadPipelineArgs);
            let result = true;
            if (!uploadPipeline) {
                onUpdate({ showUploadProgress: false, pipeline: false });
                return uploadPipeline;
            }
            if (uploadPipeline && result) {
                onUpdate({ pipeline: uploadPipeline });
            }
            return uploadPipeline;
        };
        // runKatib = async (
        //   notebookPath: string,
        //   metadata: IKaleNotebookMetadata,
        //   pipelineId: string,
        //   versionId: string,
        //   onUpdate: Function,
        // ): Promise<IKatibExperiment> => {
        //   onUpdate({ showKatibKFPExperiment: true });
        //   // create a new experiment, using the base name of the currently
        //   // selected one
        //   const newExpName: string =
        //     metadata.experiment.name +
        //     '-' +
        //     Math.random()
        //       .toString(36)
        //       .slice(2, 7);
        //   // create new KFP experiment
        //   let kfpExperiment: { id: string; name: string };
        //   try {
        //     kfpExperiment = await _legacy_executeRpc(
        //       this._notebook,
        //       this._kernel,
        //       'kfp.create_experiment',
        //       {
        //         experiment_name: newExpName,
        //       },
        //     );
        //     onUpdate({ katibKFPExperiment: kfpExperiment });
        //   } catch (error) {
        //     onUpdate({
        //       showKatibProgress: false,
        //       katibKFPExperiment: { id: 'error', name: 'error' },
        //     });
        //     throw error;
        //   }
        //   onUpdate({ showKatibProgress: true });
        //   const runKatibArgs: IKatibRunArgs = {
        //     pipeline_id: pipelineId,
        //     version_id: versionId,
        //     pipeline_metadata: {
        //       ...metadata,
        //       experiment_name: kfpExperiment.name,
        //     },
        //     output_path: notebookPath.substring(0, notebookPath.lastIndexOf('/')),
        //   };
        //   let katibExperiment: IKatibExperiment | null = null;
        //   try {
        //     katibExperiment = await _legacy_executeRpc(
        //       this._notebook,
        //       this._kernel,
        //       'katib.create_katib_experiment',
        //       runKatibArgs,
        //     );
        //   } catch (error) {
        //     onUpdate({ katib: { status: 'error' } });
        //     throw error;
        //   }
        //   return katibExperiment;
        // };
        this.runPipeline = async (pipelineId, versionId, compiledPipelineMetadata, pipelinePackagePath, onUpdate) => {
            onUpdate({ showRunProgress: true });
            const runPipelineArgs = {
                pipeline_metadata: compiledPipelineMetadata,
                pipeline_id: pipelineId,
                version_id: versionId,
                pipeline_package_path: pipelinePackagePath,
            };
            const runPipeline = await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'kfp.run_pipeline', runPipelineArgs);
            if (runPipeline) {
                onUpdate({ runPipeline });
            }
            else {
                onUpdate({ showRunProgress: false, runPipeline: false });
            }
            return runPipeline;
        };
        this.resumeStateIfExploreNotebook = async (notebookPath) => {
            const exploration = await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'nb.explore_notebook', { source_notebook_path: notebookPath });
            if (!exploration || !exploration.is_exploration) {
                return;
            }
            _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].clearCellOutputs(this._notebook);
            let title = 'Notebook Exploration';
            let message = [];
            let runCellResponse = await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].runGlobalCells(this._notebook);
            if (runCellResponse.status === RUN_CELL_STATUS.OK) {
                // unmarshalData runs in the same kernel as the .ipynb, so it requires the
                // filename
                await this.unmarshalData(notebookPath.split('/').pop() || '');
                const cell = _CellUtils__WEBPACK_IMPORTED_MODULE_3__["default"].getCellByStepName(this._notebook, exploration.step_name);
                message = [
                    `Resuming notebook ${exploration.final_snapshot ? 'after' : 'before'} step: "${exploration.step_name}"`,
                ];
                if (cell) {
                    _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].selectAndScrollToCell(this._notebook, cell);
                }
                else {
                    message.push(`ERROR: Could not retrieve step's position.`);
                }
            }
            else {
                message = [
                    `Executing "${runCellResponse.cellType}" cell failed.\n` +
                        `Resuming notebook at cell index ${runCellResponse.cellIndex}.`,
                    `Error name: ${runCellResponse.ename}`,
                    `Error value: ${runCellResponse.evalue}`,
                ];
            }
            await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].showMessage(title, message);
            await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'nb.remove_marshal_dir', {
                source_notebook_path: notebookPath,
            });
        };
        this.findPodDefaultLabelsOnServer = async () => {
            let labels = {};
            try {
                return await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpc)(this._notebook, this._kernel, 'nb.find_poddefault_labels_on_server');
            }
            catch (error) {
                console.error('Failed to retrieve PodDefaults applied on server', error);
                return labels;
            }
        };
        this.getNamespace = async () => {
            try {
                return await (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpc)(this._notebook, this._kernel, 'nb.get_namespace');
            }
            catch (error) {
                console.error("Failed to retrieve notebook's namespace");
                return '';
            }
        };
        this._notebook = notebook;
        this._kernel = kernel;
    }
    pollRun(runPipeline, onUpdate) {
        (0,_RPCUtils__WEBPACK_IMPORTED_MODULE_0__._legacy_executeRpcAndShowRPCError)(this._notebook, this._kernel, 'kfp.get_run', {
            run_id: runPipeline.id,
        }).then(run => {
            onUpdate({ runPipeline: run });
            if (run && (run.status === 'Running' || run.status === null)) {
                setTimeout(() => this.pollRun(run, onUpdate), 2000);
            }
        });
    }
}


/***/ }),

/***/ "./lib/lib/NotebookUtils.js":
/*!**********************************!*\
  !*** ./lib/lib/NotebookUtils.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ NotebookUtilities)
/* harmony export */ });
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_sanitized_html__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-sanitized-html */ "webpack/sharing/consume/default/react-sanitized-html/react-sanitized-html");
/* harmony import */ var react_sanitized_html__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_sanitized_html__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/cells */ "webpack/sharing/consume/default/@jupyterlab/cells");
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../widgets/cell-metadata/CellMetadataEditor */ "./lib/widgets/cell-metadata/CellMetadataEditor.js");
/* harmony import */ var _CellUtils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./CellUtils */ "./lib/lib/CellUtils.js");
// /*
//  * Copyright 2019-2020 The Kale Authors
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// import { Dialog, showDialog } from '@jupyterlab/apputils';
// import { NotebookPanel } from '@jupyterlab/notebook';
// import {
//   KernelMessage,
//   Kernel,
//   KernelManager,
//   KernelSpecAPI,
// } from '@jupyterlab/services';
// import { CommandRegistry } from '@lumino/commands';
// // @ts-ignore
// import SanitizedHTML from 'react-sanitized-html';
// import * as React from 'react';
// import { ReactElement } from 'react';
// import {
//   Cell,
//   CodeCell,
//   CodeCellModel,
//   isCodeCellModel,
// } from '@jupyterlab/cells';
// import { RESERVED_CELL_NAMES } from '../widgets/cell-metadata/CellMetadataEditor';
// import CellUtilities from './CellUtils';
// interface IRunCellResponse {
//   status: string;
//   cellType?: string;
//   cellIndex?: number;
//   ename?: string;
//   evalue?: string;
// }
// /** Contains utility functions for manipulating/handling notebooks in the application. */
// export default class NotebookUtilities {
//   /**
//    * Clear the outputs of all the notebook' cells
//    * @param notebook NotebookPanel
//    */
//   public static clearCellOutputs(notebook: NotebookPanel): void {
//     for (let i = 0; i < notebook.model.cells.length; i++) {
//       if (!isCodeCellModel(notebook.model.cells.get(i))) {
//         continue;
//       }
//       (notebook.model.cells.get(i) as CodeCellModel).executionCount = null;
//       (notebook.model.cells.get(i) as CodeCellModel).outputs.clear();
//     }
//   }
//   /**
//    * Scroll the notebook to the specified cell, making it active
//    * @param notebook NotebookPanel
//    * @param cell The cell to be activated
//    */
//   public static selectAndScrollToCell(
//     notebook: NotebookPanel,
//     cell: { cell: Cell; index: number },
//   ): void {
//     notebook.content.select(cell.cell);
//     notebook.content.activeCellIndex = cell.index;
//     const cellPosition = (notebook.content.node.childNodes[
//       cell.index
//     ] as HTMLElement).getBoundingClientRect();
//     notebook.content.scrollToPosition(cellPosition.top);
//   }
//   /**
//    * Builds an HTML container by sanitizing a list of strings and converting
//    * them in valid HTML
//    * @param msg A list of string with HTML formatting
//    * @returns a HTMLDivElement composed of a list of spans with formatted text
//    */
//   private static buildDialogBody(msg: string[]): ReactElement {
//     return (
//       <div className="dialog-body">
//         {msg.map((s: string, i: number) => {
//           return (
//             <React.Fragment key={`msg-${i}`}>
//               <SanitizedHTML
//                 allowedAttributes={{ a: ['href'] }}
//                 allowedTags={['b', 'i', 'em', 'strong', 'a', 'pre']}
//                 html={s}
//               />
//               <br />
//             </React.Fragment>
//           );
//         })}
//       </div>
//     );
//   }
//   /**
//    * Opens a pop-up dialog in JupyterLab to display a simple message.
//    * @param title The title for the message popup
//    * @param msg The message as an array of strings
//    * @param buttonLabel The label to use for the button. Default is 'OK'
//    * @param buttonClassName The classname to give to the 'ok' button
//    * @returns Promise<void> - A promise once the message is closed.
//    */
//   public static async showMessage(
//     title: string,
//     msg: string[],
//     buttonLabel: string = 'Close',
//     buttonClassName: string = '',
//   ): Promise<void> {
//     const buttons: ReadonlyArray<Dialog.IButton> = [
//       Dialog.okButton({ label: buttonLabel, className: buttonClassName }),
//     ];
//     const messageBody = this.buildDialogBody(msg);
//     await showDialog({ title, buttons, body: messageBody });
//   }
//   /**
//    * Opens a pop-up dialog in JupyterLab to display a yes/no dialog.
//    * @param title The title for the message popup
//    * @param msg The message
//    * @param acceptLabel The label to use for the accept button. Default is 'YES'
//    * @param rejectLabel The label to use for the reject button. Default is 'NO'
//    * @param yesButtonClassName The classname to give to the accept button.
//    * @param noButtonClassName The  classname to give to the cancel button.
//    * @returns Promise<void> - A promise once the message is closed.
//    */
//   public static async showYesNoDialog(
//     title: string,
//     msg: string[],
//     acceptLabel: string = 'YES',
//     rejectLabel: string = 'NO',
//     yesButtonClassName: string = '',
//     noButtonClassName: string = '',
//   ): Promise<boolean> {
//     const buttons: ReadonlyArray<Dialog.IButton> = [
//       Dialog.okButton({ label: acceptLabel, className: yesButtonClassName }),
//       Dialog.cancelButton({ label: rejectLabel, className: noButtonClassName }),
//     ];
//     const messageBody = this.buildDialogBody(msg);
//     const result = await showDialog({ title, buttons, body: messageBody });
//     return result.button.label === acceptLabel;
//   }
//   /**
//    * Opens a pop-up dialog in JupyterLab with various information and button
//    * triggering reloading the page.
//    * @param title The title for the message popup
//    * @param msg The message
//    * @param refreshButtonLabel The label to use for the refresh button. Default is 'Refresh'
//    * @param refreshButtonClassName The  classname to give to the refresh button
//    * @param dismissButtonLabel The label to use for the dismiss button. Default is 'Dismiss'
//    * @param dismissButtonClassName The classname to give to the dismiss button
//    * @returns Promise<void> - A promise once the message is closed.
//    */
//   public static async showRefreshDialog(
//     title: string,
//     msg: string[],
//     refreshButtonLabel: string = 'Refresh',
//     dismissButtonLabel: string = 'Dismiss',
//     refreshButtonClassName: string = '',
//     dismissButtonClassName: string = '',
//   ): Promise<void> {
//     (await this.showYesNoDialog(
//       title,
//       msg,
//       refreshButtonLabel,
//       dismissButtonLabel,
//       refreshButtonClassName,
//       dismissButtonClassName,
//     )) && location.reload();
//   }
//   /**
//    * @description Creates a new JupyterLab notebook for use by the application
//    * @param command The command registry
//    * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
//    */
//   public static async createNewNotebook(
//     command: CommandRegistry,
//   ): Promise<NotebookPanel> {
//     const notebook: NotebookPanel = await command.execute(
//       'notebook:create-new',
//       {
//         activate: true,
//         path: '',
//         preferredLanguage: '',
//       },
//     );
//     await notebook.sessionContext.ready;
//     return notebook;
//   }
//   /**
//    * Safely saves the Jupyter notebook document contents to disk
//    * @param notebookPanel The notebook panel containing the notebook to save
//    * @param withPrompt Ask the user before saving the notebook
//    * @param waitSave Await the save notebook operation
//    */
//   public static async saveNotebook(
//     notebookPanel: NotebookPanel,
//     withPrompt: boolean = false,
//     waitSave: boolean = false,
//   ): Promise<boolean> {
//     if (notebookPanel && notebookPanel.model.dirty) {
//       await notebookPanel.context.ready;
//       if (
//         withPrompt &&
//         !(await this.showYesNoDialog('Unsaved changes', [
//           'Do you want to save the notebook?',
//         ]))
//       ) {
//         return false;
//       }
//       waitSave
//         ? await notebookPanel.context.save()
//         : notebookPanel.context.save();
//       return true;
//     }
//     return false;
//   }
//   /**
//    * Convert the notebook contents to JSON
//    * @param notebookPanel The notebook panel containing the notebook to serialize
//    */
//   public static notebookToJSON(notebookPanel: NotebookPanel): any {
//     if (notebookPanel) {
//       return notebookPanel.content.model.toJSON();
//     }
//     return null;
//   }
//   /**
//    * @description Gets the value of a key from specified notebook's metadata.
//    * @param notebookPanel The notebook to get meta data from.
//    * @param key The key of the value.
//    * @returns any -The value of the metadata. Returns null if the key doesn't exist.
//    */
//   public static getMetaData(notebookPanel: NotebookPanel, key: string): any {
//     if (!notebookPanel) {
//       throw new Error(
//         'The notebook is null or undefined. No meta data available.',
//       );
//     }
//     if (notebookPanel.model && notebookPanel.model.metadata.has(key)) {
//       return notebookPanel.model.metadata.get(key);
//     }
//     return null;
//   }
//   /**
//    * @description Sets the key value pair in the notebook's metadata.
//    * If the key doesn't exists it will add one.
//    * @param notebookPanel The notebook to set meta data in.
//    * @param key The key of the value to create.
//    * @param value The value to set.
//    * @param save Default is false. Whether the notebook should be saved after the meta data is set.
//    * Note: This function will not wait for the save to complete, it only sends a save request.
//    * @returns The old value for the key, or undefined if it did not exist.
//    */
//   public static setMetaData(
//     notebookPanel: NotebookPanel,
//     key: string,
//     value: any,
//     save: boolean = false,
//   ): any {
//     if (!notebookPanel) {
//       throw new Error(
//         'The notebook is null or undefined. No meta data available.',
//       );
//     }
//     const oldVal = notebookPanel.model.metadata.set(key, value);
//     if (save) {
//       this.saveNotebook(notebookPanel);
//     }
//     return oldVal;
//   }
//   public static async runGlobalCells(
//     notebook: NotebookPanel,
//   ): Promise<IRunCellResponse> {
//     let cell = { cell: notebook.content.widgets[0], index: 0 };
//     const reservedCellsToBeIgnored = ['skip', 'pipeline-metrics'];
//     for (let i = 0; i < notebook.model.cells.length; i++) {
//       if (!isCodeCellModel(notebook.model.cells.get(i))) {
//         continue;
//       }
//       const blockName = CellUtilities.getStepName(notebook, i);
//       // If a cell of that type is found, run that
//       // and all consequent cells getting merged to that one
//       if (
//         !reservedCellsToBeIgnored.includes(blockName) &&
//         RESERVED_CELL_NAMES.includes(blockName)
//       ) {
//         while (i < notebook.model.cells.length) {
//           if (!isCodeCellModel(notebook.model.cells.get(i))) {
//             i++;
//             continue;
//           }
//           const cellName = CellUtilities.getStepName(notebook, i);
//           if (cellName !== blockName && cellName !== '') {
//             // Decrement by 1 to parse that cell during the next for loop
//             i--;
//             break;
//           }
//           cell = { cell: notebook.content.widgets[i], index: i };
//           this.selectAndScrollToCell(notebook, cell);
//           // this.setState({ activeCellIndex: cell.index, activeCell: cell.cell });
//           const kernelMsg = (await CodeCell.execute(
//             notebook.content.widgets[i] as CodeCell,
//             notebook.sessionContext,
//           )) as KernelMessage.IExecuteReplyMsg;
//           if (kernelMsg.content && kernelMsg.content.status === 'error') {
//             return {
//               status: 'error',
//               cellType: blockName,
//               cellIndex: i,
//               ename: kernelMsg.content.ename,
//               evalue: kernelMsg.content.evalue,
//             };
//           }
//           i++;
//         }
//       }
//     }
//     return { status: 'ok' };
//   }
//   /**
//    * Get a new Kernel, not tied to a Notebook
//    * Source code here: https://github.com/jupyterlab/jupyterlab/tree/473348d25bcb258ca2f0c127dd8fb5b193217135/packages/services
//    */
//   public static async createNewKernel() {
//     const defaultKernelSpec = await KernelSpecAPI.getSpecs().then(
//       (res: KernelSpecAPI.ISpecModels) => res.default,
//     );
//     return await new KernelManager().startNew({ name: defaultKernelSpec });
//   }
//   // TODO: We can use this context manager to execute commands inside a new kernel
//   //  and be sure that it will be disposed of at the end.
//   //  Another approach could be to create a kale_rpc Kernel, as a singleton,
//   //  created at startup. The only (possible) drawback is that we can not name
//   //  a kernel instance with a custom id/name, so when refreshing JupyterLab we would
//   //  not recognize the kernel. A solution could be to have a kernel spec dedicated to kale rpc calls.
//   public static async executeWithNewKernel(action: Function, args: any[] = []) {
//     // create brand new kernel
//     const _k = await this.createNewKernel();
//     // execute action inside kernel
//     const res = await action(_k, ...args);
//     // close kernel
//     _k.shutdown();
//     // return result
//     return res;
//   }
//   /**
//    * @description This function runs code directly in the notebook's kernel and then evaluates the
//    * result and returns it as a promise.
//    * @param kernel The kernel to run the code in.
//    * @param runCode The code to run in the kernel.
//    * @param userExpressions The expressions used to capture the desired info from the executed code.
//    * @param runSilent Default is false. If true, kernel will execute as quietly as possible.
//    * store_history will be set to false, and no broadcast on IOPUB channel will be made.
//    * @param storeHistory Default is false. If true, the code executed will be stored in the kernel's history
//    * and the counter which is shown in the cells will be incremented to reflect code was run.
//    * @param allowStdIn Default is false. If true, code running in kernel can prompt user for input using
//    * an input_request message.
//    * @param stopOnError Default is false. If True, does not abort the execution queue, if an exception is encountered.
//    * This allows the queued execution of multiple execute_requests, even if they generate exceptions.
//    * @returns Promise<any> - A promise containing the execution results of the code as an object with
//    * keys based on the user_expressions.
//    * @example
//    * //The code
//    * const code = "a=123\nb=456\nsum=a+b";
//    * //The user expressions
//    * const expr = {sum: "sum",prod: "a*b",args:"[a,b,sum]"};
//    * //Async function call (returns a promise)
//    * sendKernelRequest(notebookPanel, code, expr,false);
//    * //Result when promise resolves:
//    * {
//    *  sum:{status:"ok",data:{"text/plain":"579"},metadata:{}},
//    *  prod:{status:"ok",data:{"text/plain":"56088"},metadata:{}},
//    *  args:{status:"ok",data:{"text/plain":"[123, 456, 579]"}}
//    * }
//    * @see For more information on JupyterLab messages:
//    * https://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results
//    */
//   public static async sendKernelRequest(
//     kernel: Kernel.IKernelConnection,
//     runCode: string,
//     userExpressions: any,
//     runSilent: boolean = false,
//     storeHistory: boolean = false,
//     allowStdIn: boolean = false,
//     stopOnError: boolean = false,
//   ): Promise<any> {
//     if (!kernel) {
//       throw new Error('Kernel is null or undefined.');
//     }
//     const message: KernelMessage.IShellMessage = await kernel.requestExecute({
//       allow_stdin: allowStdIn,
//       code: runCode,
//       silent: runSilent,
//       stop_on_error: stopOnError,
//       store_history: storeHistory,
//       user_expressions: userExpressions,
//     }).done;
//     const content: any = message.content;
//     if (content.status !== 'ok') {
//       // If response is not 'ok', throw contents as error, log code
//       const msg: string = `Code caused an error:\n${runCode}`;
//       console.error(msg);
//       if (content.traceback) {
//         content.traceback.forEach((line: string) =>
//           console.log(
//             line.replace(
//               /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
//               '',
//             ),
//           ),
//         );
//       }
//       throw content;
//     }
//     // Return user_expressions of the content
//     return content.user_expressions;
//   }
//   /**
//    * Same as method sendKernelRequest but passing
//    * a NotebookPanel instead of a Kernel
//    */
//   public static async sendKernelRequestFromNotebook(
//     notebookPanel: NotebookPanel,
//     runCode: string,
//     userExpressions: any,
//     runSilent: boolean = false,
//     storeHistory: boolean = false,
//     allowStdIn: boolean = false,
//     stopOnError: boolean = false,
//   ) {
//     if (!notebookPanel) {
//       throw new Error('Notebook is null or undefined.');
//     }
//     // Wait for notebook panel to be ready
//     await notebookPanel.sessionContext.ready;
//     return this.sendKernelRequest(
//       notebookPanel.sessionContext.session.kernel,
//       runCode,
//       userExpressions,
//       runSilent,
//       storeHistory,
//       allowStdIn,
//       stopOnError,
//     );
//   }
// }
/*
 * Copyright 2019-2020 The Kale Authors
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


// @ts-ignore





/** Contains utility functions for manipulating/handling notebooks in the application. */
class NotebookUtilities {
    /**
     * Clear the outputs of all the notebook' cells
     * @param notebook NotebookPanel
     */
    static clearCellOutputs(notebook) {
        if (!notebook.model) {
            throw new Error('Notebook model is null');
        }
        for (let i = 0; i < notebook.model.cells.length; i++) {
            const cell = notebook.model.cells.get(i);
            if (!(0,_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_4__.isCodeCellModel)(cell)) {
                continue;
            }
            cell.executionCount = null;
            cell.outputs.clear();
        }
    }
    /**
     * Scroll the notebook to the specified cell, making it active
     * @param notebook NotebookPanel
     * @param cell The cell to be activated
     */
    static selectAndScrollToCell(notebook, cell) {
        notebook.content.select(cell.cell);
        notebook.content.activeCellIndex = cell.index;
        // Modern way to scroll to a cell - use scrollToCell if available
        // if ('scrollToCell' in notebook.content) {
        notebook.content.scrollToCell(cell.index);
        // } else {
        //   // Fallback for older versions
        //   const cellElement = notebook.content.node.children[cell.index] as HTMLElement;
        //   if (cellElement) {
        //     cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        //   }
        // }
    }
    /**
     * Builds an HTML container by sanitizing a list of strings and converting
     * them in valid HTML
     * @param msg A list of string with HTML formatting
     * @returns a HTMLDivElement composed of a list of spans with formatted text
     */
    static buildDialogBody(msg) {
        return (react__WEBPACK_IMPORTED_MODULE_3__.createElement("div", { className: "dialog-body" }, msg.map((s, i) => {
            return (react__WEBPACK_IMPORTED_MODULE_3__.createElement(react__WEBPACK_IMPORTED_MODULE_3__.Fragment, { key: `msg-${i}` },
                react__WEBPACK_IMPORTED_MODULE_3__.createElement((react_sanitized_html__WEBPACK_IMPORTED_MODULE_2___default()), { allowedAttributes: { a: ['href'] }, allowedTags: ['b', 'i', 'em', 'strong', 'a', 'pre'], html: s }),
                react__WEBPACK_IMPORTED_MODULE_3__.createElement("br", null)));
        })));
    }
    /**
     * Opens a pop-up dialog in JupyterLab to display a simple message.
     * @param title The title for the message popup
     * @param msg The message as an array of strings
     * @param buttonLabel The label to use for the button. Default is 'OK'
     * @param buttonClassName The classname to give to the 'ok' button
     * @returns Promise<void> - A promise once the message is closed.
     */
    static async showMessage(title, msg, buttonLabel = 'Close', buttonClassName = '') {
        const buttons = [
            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.Dialog.okButton({ label: buttonLabel, className: buttonClassName }),
        ];
        const messageBody = this.buildDialogBody(msg);
        await (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.showDialog)({ title, buttons, body: messageBody });
    }
    /**
     * Opens a pop-up dialog in JupyterLab to display a yes/no dialog.
     * @param title The title for the message popup
     * @param msg The message
     * @param acceptLabel The label to use for the accept button. Default is 'YES'
     * @param rejectLabel The label to use for the reject button. Default is 'NO'
     * @param yesButtonClassName The classname to give to the accept button.
     * @param noButtonClassName The  classname to give to the cancel button.
     * @returns Promise<void> - A promise once the message is closed.
     */
    static async showYesNoDialog(title, msg, acceptLabel = 'YES', rejectLabel = 'NO', yesButtonClassName = '', noButtonClassName = '') {
        const buttons = [
            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.Dialog.okButton({ label: acceptLabel, className: yesButtonClassName }),
            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.Dialog.cancelButton({ label: rejectLabel, className: noButtonClassName }),
        ];
        const messageBody = this.buildDialogBody(msg);
        const result = await (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.showDialog)({ title, buttons, body: messageBody });
        return result.button.label === acceptLabel;
    }
    /**
     * Opens a pop-up dialog in JupyterLab with various information and button
     * triggering reloading the page.
     * @param title The title for the message popup
     * @param msg The message
     * @param refreshButtonLabel The label to use for the refresh button. Default is 'Refresh'
     * @param refreshButtonClassName The  classname to give to the refresh button
     * @param dismissButtonLabel The label to use for the dismiss button. Default is 'Dismiss'
     * @param dismissButtonClassName The classname to give to the dismiss button
     * @returns Promise<void> - A promise once the message is closed.
     */
    static async showRefreshDialog(title, msg, refreshButtonLabel = 'Refresh', dismissButtonLabel = 'Dismiss', refreshButtonClassName = '', dismissButtonClassName = '') {
        (await this.showYesNoDialog(title, msg, refreshButtonLabel, dismissButtonLabel, refreshButtonClassName, dismissButtonClassName)) && location.reload();
    }
    /**
     * @description Creates a new JupyterLab notebook for use by the application
     * @param command The command registry
     * @returns Promise<NotebookPanel> - A promise containing the notebook panel object that was created (if successful).
     */
    static async createNewNotebook(command) {
        const notebook = await command.execute('notebook:create-new', {
            activate: true,
            path: '',
            preferredLanguage: '',
        });
        await notebook.sessionContext.ready;
        return notebook;
    }
    /**
     * Safely saves the Jupyter notebook document contents to disk
     * @param notebookPanel The notebook panel containing the notebook to save
     * @param withPrompt Ask the user before saving the notebook
     * @param waitSave Await the save notebook operation
     */
    static async saveNotebook(notebookPanel, withPrompt = false, waitSave = false) {
        if (!(notebookPanel === null || notebookPanel === void 0 ? void 0 : notebookPanel.model)) {
            return false;
        }
        if (notebookPanel.model.dirty) {
            await notebookPanel.context.ready;
            if (withPrompt &&
                !(await this.showYesNoDialog('Unsaved changes', [
                    'Do you want to save the notebook?',
                ]))) {
                return false;
            }
            waitSave
                ? await notebookPanel.context.save()
                : notebookPanel.context.save();
            return true;
        }
        return false;
    }
    /**
     * Convert the notebook contents to JSON
     * @param notebookPanel The notebook panel containing the notebook to serialize
     */
    static notebookToJSON(notebookPanel) {
        var _a;
        if ((_a = notebookPanel === null || notebookPanel === void 0 ? void 0 : notebookPanel.content) === null || _a === void 0 ? void 0 : _a.model) {
            return notebookPanel.content.model.toJSON();
        }
        return null;
    }
    /**
     * @description Gets the value of a key from specified notebook's metadata.
     * @param notebookPanel The notebook to get meta data from.
     * @param key The key of the value.
     * @returns any -The value of the metadata. Returns null if the key doesn't exist.
     */
    static getMetaData(notebookPanel, key) {
        var _a;
        if (!notebookPanel) {
            throw new Error('The notebook is null or undefined. No meta data available.');
        }
        if ((_a = notebookPanel.model) === null || _a === void 0 ? void 0 : _a.metadata) {
            const metadata = notebookPanel.model.metadata;
            if (typeof metadata.has === 'function' && metadata.has(key)) {
                return metadata.get(key);
            }
            // Fallback for different metadata implementations
            return metadata[key] || null;
        }
        return null;
    }
    /**
     * @description Sets the key value pair in the notebook's metadata.
     * If the key doesn't exists it will add one.
     * @param notebookPanel The notebook to set meta data in.
     * @param key The key of the value to create.
     * @param value The value to set.
     * @param save Default is false. Whether the notebook should be saved after the meta data is set.
     * Note: This function will not wait for the save to complete, it only sends a save request.
     * @returns The old value for the key, or undefined if it did not exist.
     */
    static setMetaData(notebookPanel, key, value, save = false) {
        var _a;
        if (!notebookPanel) {
            throw new Error('The notebook is null or undefined. No meta data available.');
        }
        if (!((_a = notebookPanel.model) === null || _a === void 0 ? void 0 : _a.metadata)) {
            throw new Error('Notebook metadata is not available.');
        }
        const metadata = notebookPanel.model.metadata;
        let oldVal;
        if (typeof metadata.set === 'function') {
            oldVal = metadata.set(key, value);
        }
        else {
            // Fallback for different metadata implementations
            oldVal = metadata[key];
            metadata[key] = value;
        }
        if (save) {
            this.saveNotebook(notebookPanel);
        }
        return oldVal;
    }
    static async runGlobalCells(notebook) {
        if (!notebook.model) {
            throw new Error('Notebook model is null');
        }
        let cell = { cell: notebook.content.widgets[0], index: 0 };
        const reservedCellsToBeIgnored = ['skip', 'pipeline-metrics'];
        for (let i = 0; i < notebook.model.cells.length; i++) {
            const cellModel = notebook.model.cells.get(i);
            if (!(0,_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_4__.isCodeCellModel)(cellModel)) {
                continue;
            }
            const blockName = _CellUtils__WEBPACK_IMPORTED_MODULE_6__["default"].getStepName(notebook, i);
            // If a cell of that type is found, run that
            // and all consequent cells getting merged to that one
            if (!reservedCellsToBeIgnored.includes(blockName) &&
                _widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_5__.RESERVED_CELL_NAMES.includes(blockName)) {
                while (i < notebook.model.cells.length) {
                    const currentCellModel = notebook.model.cells.get(i);
                    if (!(0,_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_4__.isCodeCellModel)(currentCellModel)) {
                        i++;
                        continue;
                    }
                    const cellName = _CellUtils__WEBPACK_IMPORTED_MODULE_6__["default"].getStepName(notebook, i);
                    if (cellName !== blockName && cellName !== '') {
                        // Decrement by 1 to parse that cell during the next for loop
                        i--;
                        break;
                    }
                    cell = { cell: notebook.content.widgets[i], index: i };
                    this.selectAndScrollToCell(notebook, cell);
                    // Execute the cell with proper error handling
                    try {
                        const kernelMsg = (await _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_4__.CodeCell.execute(notebook.content.widgets[i], notebook.sessionContext));
                        if (kernelMsg.content && kernelMsg.content.status === 'error') {
                            return {
                                status: 'error',
                                cellType: blockName,
                                cellIndex: i,
                                ename: kernelMsg.content.ename,
                                evalue: kernelMsg.content.evalue,
                            };
                        }
                    }
                    catch (error) {
                        return {
                            status: 'error',
                            cellType: blockName,
                            cellIndex: i,
                            ename: 'ExecutionError',
                            evalue: String(error),
                        };
                    }
                    i++;
                }
            }
        }
        return { status: 'ok' };
    }
    /**
     * Get a new Kernel, not tied to a Notebook
     * Source code here: https://github.com/jupyterlab/jupyterlab/tree/473348d25bcb258ca2f0c127dd8fb5b193217135/packages/services
     */
    static async createNewKernel() {
        const specs = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.KernelSpecAPI.getSpecs();
        const defaultKernelSpec = specs.default;
        return await new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.KernelManager().startNew({ name: defaultKernelSpec });
    }
    // TODO: We can use this context manager to execute commands inside a new kernel
    //  and be sure that it will be disposed of at the end.
    //  Another approach could be to create a kale_rpc Kernel, as a singleton,
    //  created at startup. The only (possible) drawback is that we can not name
    //  a kernel instance with a custom id/name, so when refreshing JupyterLab we would
    //  not recognize the kernel. A solution could be to have a kernel spec dedicated to kale rpc calls.
    static async executeWithNewKernel(action, args = []) {
        // create brand new kernel
        const _k = await this.createNewKernel();
        // execute action inside kernel
        const res = await action(_k, ...args);
        // close kernel
        _k.shutdown();
        // return result
        return res;
    }
    /**
     * @description This function runs code directly in the notebook's kernel and then evaluates the
     * result and returns it as a promise.
     * @param kernel The kernel to run the code in.
     * @param runCode The code to run in the kernel.
     * @param userExpressions The expressions used to capture the desired info from the executed code.
     * @param runSilent Default is false. If true, kernel will execute as quietly as possible.
     * store_history will be set to false, and no broadcast on IOPUB channel will be made.
     * @param storeHistory Default is false. If true, the code executed will be stored in the kernel's history
     * and the counter which is shown in the cells will be incremented to reflect code was run.
     * @param allowStdIn Default is false. If true, code running in kernel can prompt user for input using
     * an input_request message.
     * @param stopOnError Default is false. If True, does not abort the execution queue, if an exception is encountered.
     * This allows the queued execution of multiple execute_requests, even if they generate exceptions.
     * @returns Promise<any> - A promise containing the execution results of the code as an object with
     * keys based on the user_expressions.
     * @example
     * //The code
     * const code = "a=123\nb=456\nsum=a+b";
     * //The user expressions
     * const expr = {sum: "sum",prod: "a*b",args:"[a,b,sum]"};
     * //Async function call (returns a promise)
     * sendKernelRequest(notebookPanel, code, expr,false);
     * //Result when promise resolves:
     * {
     *  sum:{status:"ok",data:{"text/plain":"579"},metadata:{}},
     *  prod:{status:"ok",data:{"text/plain":"56088"},metadata:{}},
     *  args:{status:"ok",data:{"text/plain":"[123, 456, 579]"}}
     * }
     * @see For more information on JupyterLab messages:
     * https://jupyter-client.readthedocs.io/en/latest/messaging.html#execution-results
     */
    static async sendKernelRequest(kernel, runCode, userExpressions, runSilent = false, storeHistory = false, allowStdIn = false, stopOnError = false) {
        if (!kernel) {
            throw new Error('Kernel is null or undefined.');
        }
        const message = await kernel.requestExecute({
            allow_stdin: allowStdIn,
            code: runCode,
            silent: runSilent,
            stop_on_error: stopOnError,
            store_history: storeHistory,
            user_expressions: userExpressions,
        }).done;
        const content = message.content;
        if (content.status !== 'ok') {
            // If response is not 'ok', throw contents as error, log code
            const msg = `Code caused an error:\n${runCode}`;
            console.error(msg);
            if (content.traceback) {
                content.traceback.forEach((line) => console.log(line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')));
            }
            throw content;
        }
        // Return user_expressions of the content
        return content.user_expressions;
    }
    /**
     * Same as method sendKernelRequest but passing
     * a NotebookPanel instead of a Kernel
     */
    static async sendKernelRequestFromNotebook(notebookPanel, runCode, userExpressions, runSilent = false, storeHistory = false, allowStdIn = false, stopOnError = false) {
        var _a;
        if (!notebookPanel) {
            throw new Error('Notebook is null or undefined.');
        }
        // Wait for notebook panel to be ready
        await notebookPanel.sessionContext.ready;
        const kernel = (_a = notebookPanel.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (!kernel) {
            throw new Error('Kernel is not available.');
        }
        return this.sendKernelRequest(kernel, runCode, userExpressions, runSilent, storeHistory, allowStdIn, stopOnError);
    }
}


/***/ }),

/***/ "./lib/lib/RPCUtils.js":
/*!*****************************!*\
  !*** ./lib/lib/RPCUtils.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseError: () => (/* binding */ BaseError),
/* harmony export */   JSONParseError: () => (/* binding */ JSONParseError),
/* harmony export */   KernelError: () => (/* binding */ KernelError),
/* harmony export */   RPCError: () => (/* binding */ RPCError),
/* harmony export */   RPC_CALL_STATUS: () => (/* binding */ RPC_CALL_STATUS),
/* harmony export */   _legacy_executeRpc: () => (/* binding */ _legacy_executeRpc),
/* harmony export */   _legacy_executeRpcAndShowRPCError: () => (/* binding */ _legacy_executeRpcAndShowRPCError),
/* harmony export */   executeRpc: () => (/* binding */ executeRpc),
/* harmony export */   globalUnhandledRejection: () => (/* binding */ globalUnhandledRejection),
/* harmony export */   rokErrorTooltip: () => (/* binding */ rokErrorTooltip),
/* harmony export */   showError: () => (/* binding */ showError),
/* harmony export */   showRpcError: () => (/* binding */ showRpcError)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./NotebookUtils */ "./lib/lib/NotebookUtils.js");
/* harmony import */ var _jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/nbformat */ "webpack/sharing/consume/default/@jupyterlab/nbformat");
/* harmony import */ var _jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_3__);
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




const globalUnhandledRejection = async (event) => {
    // console.error(event.reason);
    if (event.reason instanceof BaseError) {
        console.error(event.reason.message, event.reason.error);
        event.reason.showDialog().then();
    }
    else {
        showError('An unexpected error has occurred', 'JS', `${event.reason.name}: ${event.reason.message}`, 'Please see the console for more information', true).then();
    }
};
var RPC_CALL_STATUS;
(function (RPC_CALL_STATUS) {
    RPC_CALL_STATUS[RPC_CALL_STATUS["OK"] = 0] = "OK";
    RPC_CALL_STATUS[RPC_CALL_STATUS["ImportError"] = 1] = "ImportError";
    RPC_CALL_STATUS[RPC_CALL_STATUS["EncodingError"] = 2] = "EncodingError";
    RPC_CALL_STATUS[RPC_CALL_STATUS["NotFound"] = 3] = "NotFound";
    RPC_CALL_STATUS[RPC_CALL_STATUS["InternalError"] = 4] = "InternalError";
    RPC_CALL_STATUS[RPC_CALL_STATUS["ServiceUnavailable"] = 5] = "ServiceUnavailable";
    RPC_CALL_STATUS[RPC_CALL_STATUS["UnhandledError"] = 6] = "UnhandledError";
})(RPC_CALL_STATUS || (RPC_CALL_STATUS = {}));
const getRpcCodeName = (code) => {
    switch (code) {
        case RPC_CALL_STATUS.OK:
            return 'OK';
        case RPC_CALL_STATUS.ImportError:
            return 'ImportError';
        case RPC_CALL_STATUS.EncodingError:
            return 'EncodingError';
        case RPC_CALL_STATUS.NotFound:
            return 'NotFound';
        case RPC_CALL_STATUS.InternalError:
            return 'InternalError';
        case RPC_CALL_STATUS.ServiceUnavailable:
            return 'ServiceUnavailable';
        default:
            return 'UnhandledError';
    }
};
const rokErrorTooltip = (rokError) => {
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
        react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null,
            "This feature requires Rok.",
            ' ',
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("a", { onClick: _ => showRpcError(rokError) }, "More info..."))));
};
const serialize = (obj) => window.btoa(JSON.stringify(obj));
const deserialize = (raw_data) => window.atob(raw_data.substring(1, raw_data.length - 1));
/**
 * Execute kale.rpc module functions
 * Example: func_result = await this.executeRpc(kernel | notebookPanel, "rpc_submodule.func", {arg1, arg2})
 *    where func_result is a JSON object
 * @param func Function name to be executed
 * @param kwargs Dictionary with arguments to be passed to the function
 * @param ctx Dictionary with the RPC context (e.g., nb_path)
 * @param env instance of Kernel or NotebookPanel
 */
const executeRpc = async (env, func, kwargs = {}, ctx = {}) => {
    const cmd = `from kale.rpc.run import run as __kale_rpc_run\n` +
        `__kale_rpc_result = __kale_rpc_run("${func}", '${serialize(kwargs)}', '${serialize(ctx)}')`;
    console.log('Executing command: ' + cmd);
    const expressions = { result: '__kale_rpc_result' };
    let output = null;
    try {
        output =
            env instanceof _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__.NotebookPanel
                ? await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].sendKernelRequestFromNotebook(env, cmd, expressions)
                : await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].sendKernelRequest(env, cmd, expressions);
    }
    catch (e) {
        if (typeof e === 'object' && e !== null) {
            if ('output_type' in e && (0,_jupyterlab_nbformat__WEBPACK_IMPORTED_MODULE_3__.isError)(e)) {
                console.warn(e);
                const error = {
                    rpc: `${func}`,
                    status: `${e.ename}: ${e.evalue}`,
                    output: e.traceback,
                };
                throw new KernelError(error);
            }
        }
        // Handle other types of errors
        console.error('An unexpected error occurred:', e);
        throw new Error('An unexpected error occurred.');
    }
    // const argsAsStr = Object.keys(kwargs).map(key => `${key}=${kwargs[key]}`).join(', ');
    let msg = [`RPC: ${func}`];
    // Log output
    if (output.result.status !== 'ok') {
        const title = `Kernel failed during code execution`;
        msg = msg.concat([
            `Status: ${output.result.status}`,
            `Output: ${JSON.stringify(output, null, 3)}`,
        ]);
        const error = {
            rpc: `${func}`,
            status: output.result.status,
            output: output,
        };
        throw new KernelError(error);
    }
    // console.log(msg.concat([output]));
    const raw_data = output.result.data['text/plain'];
    const json_data = deserialize(raw_data);
    // Validate response is a JSON
    // If successful, run() method returns json.dumps() of any result
    let parsedResult = undefined;
    try {
        parsedResult = JSON.parse(json_data);
    }
    catch (error) {
        const title = `Failed to parse response as JSON`;
        msg = msg.concat([
            `Error: ${JSON.stringify(error, null, 3)}`,
            `Response data: ${json_data}`,
        ]);
        const jsonError = {
            rpc: `${func}`,
            err_message: 'Failed to parse response as JSON',
            error: error,
            jsonData: json_data,
        };
        throw new JSONParseError(jsonError);
    }
    if (parsedResult.code !== 0) {
        const title = `An error has occured`;
        msg = msg.concat([
            `Code: ${parsedResult.code} (${getRpcCodeName(parsedResult.code)})`,
            `Message: ${parsedResult.err_message}`,
            `Details: ${parsedResult.err_details}`,
        ]);
        let error = {
            rpc: `${func}`,
            code: parsedResult.code,
            err_message: parsedResult.err_message,
            err_details: parsedResult.err_details,
            err_cls: parsedResult.err_cls,
            trans_id: parsedResult.trans_id,
        };
        throw new RPCError(error);
    }
    else {
        // console.log(msg, parsedResult);
        return parsedResult.result;
    }
};
const showError = async (title, type, message, details, refresh = true, method = null, code = null, trans_id = null) => {
    let msg = [
        `Browser: ${navigator ? navigator.userAgent : 'other'}`,
        `Type: ${type}`,
    ];
    if (method) {
        msg.push(`Method: ${method}()`);
    }
    if (code) {
        msg.push(`Code: ${code} (${getRpcCodeName(code)})`);
    }
    if (trans_id) {
        msg.push(`Transaction ID: ${trans_id}`);
    }
    msg.push(`Message: ${message}`, `Details: ${details}`);
    if (refresh) {
        await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].showRefreshDialog(title, msg);
    }
    else {
        await _NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].showMessage(title, msg);
    }
};
const showRpcError = async (error, refresh = false) => {
    await showError('An RPC Error has occurred', 'RPC', error.err_message, error.err_details, refresh, error.rpc, error.code, error.trans_id);
};
// todo: refactor these legacy functions
const _legacy_executeRpc = async (notebook, kernel, func, args = {}, nb_path = null) => {
    if (!nb_path && notebook) {
        nb_path = notebook.context.path;
    }
    let retryRpc = true;
    let result = null;
    // Kerned aborts the execution if busy
    // If that is the case, retry the RPC
    while (retryRpc) {
        try {
            result = await executeRpc(kernel, func, args, { nb_path });
            retryRpc = false;
        }
        catch (error) {
            if (error instanceof KernelError && error.error.status === 'aborted') {
                continue;
            }
            // If kernel not busy, throw the error
            throw error;
        }
    }
    return result;
};
// Execute RPC and if an RPCError is caught, show dialog and return null
// This is our default behavior prior to this commit. This may probably
// change in the future, setting custom logic for each RPC call. For
// example, see getBaseImage().
const _legacy_executeRpcAndShowRPCError = async (notebook, kernel, func, args = {}, nb_path = null) => {
    try {
        const result = await _legacy_executeRpc(notebook, kernel, func, args, nb_path);
        return result;
    }
    catch (error) {
        if (error instanceof RPCError) {
            await error.showDialog();
            return null;
        }
        throw error;
    }
};
class BaseError extends Error {
    constructor(message, error) {
        super(message);
        this.error = error;
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
        else {
            this.stack = new Error(message).stack;
        }
        Object.setPrototypeOf(this, BaseError.prototype);
    }
}
class KernelError extends BaseError {
    constructor(error) {
        super('Kernel error', error);
        Object.setPrototypeOf(this, KernelError.prototype);
    }
    async showDialog(refresh = true) {
        await showError('A Kernel Error has occurred', 'Kernel', this.error.status, JSON.stringify(this.error.output, null, 3), refresh, this.error.rpc);
    }
}
class JSONParseError extends BaseError {
    constructor(error) {
        super('JSON Parse error', error);
        Object.setPrototypeOf(this, JSONParseError.prototype);
    }
    async showDialog(refresh = false) {
        await showError('Failed to parse RPC response as JSON', 'JSONParse', this.error.error.message, this.error.json_data, refresh, this.error.rpc);
    }
}
class RPCError extends BaseError {
    constructor(error) {
        super('RPC Error', error);
        Object.setPrototypeOf(this, RPCError.prototype);
    }
    async showDialog(refresh = false) {
        await showRpcError(this.error, refresh);
    }
}


/***/ }),

/***/ "./lib/lib/TagsUtils.js":
/*!******************************!*\
  !*** ./lib/lib/TagsUtils.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TagsUtils)
/* harmony export */ });
/* harmony import */ var _CellUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CellUtils */ "./lib/lib/CellUtils.js");
/* harmony import */ var _widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../widgets/cell-metadata/CellMetadataEditor */ "./lib/widgets/cell-metadata/CellMetadataEditor.js");
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/cells */ "webpack/sharing/consume/default/@jupyterlab/cells");
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2__);
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
        const tags = _CellUtils__WEBPACK_IMPORTED_MODULE_0__["default"].getCellMetaData(notebook, index, 'tags');
        if (tags) {
            let b_name = tags.map(v => {
                if (_widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_1__.RESERVED_CELL_NAMES.includes(v)) {
                    return v;
                }
                if (v.startsWith('step:')) {
                    return v.replace('step:', '');
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
        if (!_widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_1__.RESERVED_CELL_NAMES.includes(metadata.blockName)) {
            nb = 'block:' + nb;
        }
        const stepDependencies = metadata.prevBlockNames || [];
        const limits = metadata.limits || {};
        const tags = [nb]
            .concat(stepDependencies.map(v => 'prev:' + v))
            .concat(Object.keys(limits).map(lim => 'limit:' + lim + ':' + limits[lim]));
        return _CellUtils__WEBPACK_IMPORTED_MODULE_0__["default"].setCellMetaData(notebookPanel, index, 'tags', tags, save);
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
            const tags = _CellUtils__WEBPACK_IMPORTED_MODULE_0__["default"].getCellMetaData(notebookPanel.content, i, 'tags');
            // If there is a prev tag that points to the old name, update it with the
            // new one.
            let newTags = (tags || [])
                .map(t => {
                if (t === 'prev:' + oldBlockName) {
                    return _widgets_cell_metadata_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_1__.RESERVED_CELL_NAMES.includes(newBlockName)
                        ? ''
                        : 'prev:' + newBlockName;
                }
                else {
                    return t;
                }
            })
                .filter(t => t !== '' && t !== 'prev:');
            allPromises.push(_CellUtils__WEBPACK_IMPORTED_MODULE_0__["default"].setCellMetaData(notebookPanel, i, 'tags', newTags, false));
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
        if (!(removedCell instanceof _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2__.CodeCellModel)) {
            return;
        }
        const metadata = removedCell.metadata;
        let tagsValue;
        if (metadata && typeof metadata.get === 'function') {
            tagsValue = metadata.get('tags');
        }
        else if (metadata && metadata.tags) {
            tagsValue = metadata.tags;
        }
        else {
            return; // No tags found
        }
        if (!Array.isArray(tagsValue)) {
            return;
        }
        const tags = tagsValue.filter((tag) => typeof tag === 'string');
        if (!tags) {
            return;
        }
        const blockName = tags
            .filter(t => t.startsWith('step:'))
            .map(t => t.replace('step:', ''))[0];
        if (!blockName) {
            return;
        }
        const removedDependency = `prev:${blockName}`;
        this.cellsToArray(notebook)
            .filter(cell => {
            const cellTags = cell.metadata.get('tags');
            return Array.isArray(cellTags) && cellTags.includes(removedDependency);
        })
            .forEach(cell => {
            const cellTags = cell.metadata.get('tags');
            if (Array.isArray(cellTags)) {
                const newTags = cellTags.filter(e => e !== removedDependency);
                cell.metadata.set('tags', newTags);
            }
        });
        notebook.context.save();
    }
}


/***/ }),

/***/ "./lib/widget.js":
/*!***********************!*\
  !*** ./lib/widget.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IKubeflowKale: () => (/* binding */ IKubeflowKale),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/docmanager */ "webpack/sharing/consume/default/@jupyterlab/docmanager");
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @lumino/coreutils */ "webpack/sharing/consume/default/@lumino/coreutils");
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _style_index_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../style/index.css */ "./style/index.css");
/* harmony import */ var _widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./widgets/LeftPanel */ "./lib/widgets/LeftPanel.js");
/* harmony import */ var _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./lib/NotebookUtils */ "./lib/lib/NotebookUtils.js");
/* harmony import */ var _lib_RPCUtils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./lib/RPCUtils */ "./lib/lib/RPCUtils.js");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_10__);
/*
 * Copyright 2019-2020 The Kale Authors
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
///<reference path="../node_modules/@types/node/index.d.ts"/>











/* tslint:disable */
const IKubeflowKale = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_4__.Token('kubeflow-kale:IKubeflowKale');
const id = 'kubeflow-kale:deploymentPanel';
/**
 * Adds a visual Kubeflow Pipelines Deployment tool to the sidebar.
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    activate,
    id,
    requires: [_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell, _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILayoutRestorer, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__.INotebookTracker, _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__.IDocumentManager],
    provides: IKubeflowKale,
    autoStart: true,
});
async function activate(lab, labShell, restorer, tracker, docManager) {
    let widget;
    const kernel = await _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_8__["default"].createNewKernel();
    window.addEventListener('beforeunload', () => kernel.shutdown());
    window.addEventListener('unhandledrejection', _lib_RPCUtils__WEBPACK_IMPORTED_MODULE_9__.globalUnhandledRejection);
    /**
     * Detect if Kale is installed
     */
    async function getBackend(kernel) {
        try {
            await _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_8__["default"].sendKernelRequest(kernel, `import kale`, {});
        }
        catch (error) {
            console.error('Kale backend is not installed.');
            return false;
        }
        return true;
    }
    // TODO: backend can become an Enum that indicates the type of
    //  env we are in (like Local Laptop, MiniKF, GCP, UI without Kale, ...)
    const backend = await getBackend(kernel);
    // let rokError: IRPCError = null;
    if (backend) {
        try {
            await (0,_lib_RPCUtils__WEBPACK_IMPORTED_MODULE_9__.executeRpc)(kernel, 'log.setup_logging');
        }
        catch (error) {
            (0,_lib_RPCUtils__WEBPACK_IMPORTED_MODULE_9__.globalUnhandledRejection)({ reason: error });
            throw error;
        }
    }
    //   try {
    //     await executeRpc(kernel, 'rok.check_rok_availability');
    //   } catch (error) {
    //     const unexpectedErrorCodes = [
    //       RPC_CALL_STATUS.EncodingError,
    //       RPC_CALL_STATUS.ImportError,
    //       RPC_CALL_STATUS.UnhandledError,
    //     ];
    //     if (
    //       error instanceof RPCError &&
    //       !unexpectedErrorCodes.includes(error.error.code)
    //     ) {
    //       rokError = error.error;
    //       console.warn('Rok is not available', rokError);
    //     } else {
    //       globalUnhandledRejection({ reason: error });
    //       throw error;
    //     }
    //   }
    // } else {
    //   rokError = {
    //     rpc: 'rok.check_rok_availability',
    //     code: RPC_CALL_STATUS.ImportError,
    //     err_message: 'Rok is not available',
    //     err_details:
    //       'To use this Rok feature you first need Kale running' +
    //       ' in the backend.',
    //     err_cls: 'importError',
    //   };
    //   console.warn('Rok is not available', rokError);
    async function loadPanel() {
        let reveal_widget = undefined;
        if (backend) {
            // Check if KALE_NOTEBOOK_PATH env variable exists and if so load
            // that Notebook
            const path = await (0,_lib_RPCUtils__WEBPACK_IMPORTED_MODULE_9__.executeRpc)(kernel, 'nb.resume_notebook_path', {
                server_root: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_10__.PageConfig.getOption('serverRoot'),
            });
            if (path) {
                console.log('Resuming notebook ' + path);
                // open the notebook panel
                reveal_widget = docManager.openOrReveal(path);
            }
        }
        // add widget
        if (widget && !widget.isAttached) {
            labShell.add(widget, 'left');
        }
        // open widget if resuming from a notebook
        if (reveal_widget && widget) {
            // open kale panel
            widget.activate();
        }
    }
    // Creates the left side bar widget once the app has fully started
    lab.started.then(() => {
        // show list of commands in the commandRegistry
        // console.log(lab.commands.listCommands());
        widget = _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_3__.ReactWidget.create(react__WEBPACK_IMPORTED_MODULE_5__.createElement(_widgets_LeftPanel__WEBPACK_IMPORTED_MODULE_7__.KubeflowKaleLeftPanel, { lab: lab, tracker: tracker, docManager: docManager, backend: backend, kernel: kernel }));
        widget.id = 'kubeflow-kale/kubeflowDeployment';
        widget.title.iconClass = 'jp-kale-logo jp-SideBar-tabIcon';
        widget.title.caption = 'Kubeflow Pipelines Deployment Panel';
        widget.node.classList.add('kale-panel');
        restorer.add(widget, widget.id);
    });
    // Initialize once the application shell has been restored
    // and all the widgets have been added to the NotebookTracker
    lab.restored.then(() => {
        loadPanel();
    });
    return {
        get widget() {
            if (!widget) {
                throw new Error('Widget not initialized yet');
            }
            return widget;
        }
    };
}


/***/ }),

/***/ "./lib/widgets/LeftPanel.js":
/*!**********************************!*\
  !*** ./lib/widgets/LeftPanel.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultState: () => (/* binding */ DefaultState),
/* harmony export */   KubeflowKaleLeftPanel: () => (/* binding */ KubeflowKaleLeftPanel),
/* harmony export */   NEW_EXPERIMENT: () => (/* binding */ NEW_EXPERIMENT)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../lib/NotebookUtils */ "./lib/lib/NotebookUtils.js");
/* harmony import */ var _cell_metadata_InlineCellMetadata__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./cell-metadata/InlineCellMetadata */ "./lib/widgets/cell-metadata/InlineCellMetadata.js");
/* harmony import */ var _components_DeployButton__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/DeployButton */ "./lib/components/DeployButton.js");
/* harmony import */ var _components_ExperimentInput__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/ExperimentInput */ "./lib/components/ExperimentInput.js");
/* harmony import */ var _deploys_progress_DeploysProgress__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./deploys-progress/DeploysProgress */ "./lib/widgets/deploys-progress/DeploysProgress.js");
/* harmony import */ var _mui_material_styles__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @mui/material/styles */ "./node_modules/@mui/material/esm/styles/ThemeProvider.js");
/* harmony import */ var _Theme__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../Theme */ "./lib/Theme.js");
/* harmony import */ var _components_Input__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../components/Input */ "./lib/components/Input.js");
/* harmony import */ var _lib_Commands__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../lib/Commands */ "./lib/lib/Commands.js");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_11__);
/*
 * Copyright 2019-2020 The Kale Authors
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



// import { AdvancedSettings } from '../components/AdvancedSettings';

// import { SELECT_VOLUME_TYPES, VolumesPanel } from './VolumesPanel';





// import { KatibDialog } from './KatibDialog';



const KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook';
const NEW_EXPERIMENT = {
    name: '+ New Experiment',
    id: 'new',
};
// export interface IKatibExperiment {
//   apiVersion: string;
//   name?: string;
//   namespace?: string;
//   status: string;
//   reason: string;
//   message: string;
//   trials?: number;
//   trialsFailed?: number;
//   trialsRunning?: number;
//   trialsSucceeded?: number;
//   maxTrialCount?: number;
//   currentOptimalTrial?: {
//     bestTrialName: string;
//     parameterAssignments: { name: string; value: string }[];
//     observation: {
//       metrics: {
//         name: string;
//         value?: number; // v1alpha3
//         latest?: string; //v1beta1
//         max?: string; //v1beta1
//         min?: string; //v1beta1
//       }[];
//     };
//   };
// }
const DefaultState = {
    metadata: {
        experiment: { id: '', name: '' },
        experiment_name: '',
        pipeline_name: '',
        pipeline_description: '',
        docker_image: '',
        // volumes: [],
        // snapshot_volumes: false,
        // autosnapshot: false,
        // katib_run: false,
        steps_defaults: [],
        // volume_access_mode: 'rwm',
    },
    runDeployment: false,
    deploymentType: 'compile',
    deployDebugMessage: false,
    experiments: [],
    gettingExperiments: false,
    // notebookVolumes: [],
    // volumes: [],
    // selectVolumeTypes: SELECT_VOLUME_TYPES,
    deploys: {},
    isEnabled: false,
    // katibDialog: false,
    namespace: '',
};
let deployIndex = 0;
class KubeflowKaleLeftPanel extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor() {
        super(...arguments);
        // init state default values
        this.state = DefaultState;
        this.getActiveNotebook = () => {
            return this.props.tracker.currentWidget;
        };
        this.getActiveNotebookPath = () => {
            var _a;
            return (this.getActiveNotebook() &&
                // absolute path to the notebook's root (--notebook-dir option, if set)
                _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_11__.PageConfig.getOption('serverRoot') +
                    '/' +
                    (
                    // relative path wrt to 'serverRoot'
                    (_a = this.getActiveNotebook()) === null || _a === void 0 ? void 0 : _a.context.path));
        };
        // update metadata state values: use destructure operator to update nested dict
        this.updateExperiment = (experiment) => this.setState((prevState, props) => ({
            metadata: {
                ...prevState.metadata,
                experiment: experiment,
                experiment_name: experiment.name,
            },
        }));
        this.updatePipelineName = (name) => this.setState((prevState, props) => ({
            metadata: { ...prevState.metadata, pipeline_name: name },
        }));
        this.updatePipelineDescription = (desc) => this.setState((prevState, props) => ({
            metadata: { ...prevState.metadata, pipeline_description: desc },
        }));
        this.updateDockerImage = (name) => this.setState((prevState, props) => ({
            metadata: {
                ...prevState.metadata,
                docker_image: name,
            },
        }));
        // updateVolumesSwitch = () => {
        //   this.setState((prevState, props) => ({
        //     volumes: prevState.notebookVolumes,
        //     metadata: {
        //       ...prevState.metadata,
        //       volumes: prevState.notebookVolumes,
        //       snapshot_volumes: !prevState.metadata.snapshot_volumes,
        //       storage_class_name: undefined,
        //       volume_access_mode: undefined,
        //     },
        //   }));
        // };
        // updateAutosnapshotSwitch = (autosnapshot?: boolean) =>
        //   this.setState((prevState, props) => ({
        //     metadata: {
        //       ...prevState.metadata,
        //       autosnapshot:
        //         autosnapshot === undefined
        //           ? !prevState.metadata.autosnapshot
        //           : autosnapshot,
        //     },
        //   }));
        // getNotebookMountPoints = (): { label: string; value: string }[] => {
        //   const mountPoints: { label: string; value: string }[] = [];
        //   this.state.notebookVolumes?.map(item => {   // check is optional using ?
        //     mountPoints.push({ label: item.mount_point, value: item.mount_point });
        //   });
        //   return mountPoints;
        // };
        this.activateRunDeployState = (type) => {
            if (!this.state.runDeployment) {
                this.setState({ runDeployment: true, deploymentType: type });
                this.runDeploymentCommand();
            }
        };
        this.changeDeployDebugMessage = () => this.setState((prevState, props) => ({
            deployDebugMessage: !prevState.deployDebugMessage,
        }));
        // updateStorageClassName = (storage_class_name: string) =>
        //   this.setState((prevState, props) => ({
        //     metadata: { ...prevState.metadata, storage_class_name },
        //   }));
        // updateVolumeAccessMode = (volume_access_mode: string) => {
        //   this.setState((prevState, props) => ({
        //     metadata: { ...prevState.metadata, volume_access_mode },
        //   }));
        // };
        // updateKatibRun = () =>
        //   this.setState((prevState, props) => ({
        //     metadata: {
        //       ...prevState.metadata,
        //       katib_run: !prevState.metadata.katib_run,
        //     },
        //   }));
        // updateKatibMetadata = (metadata: IKatibMetadata) =>
        //   this.setState((prevState, props) => ({
        //     metadata: {
        //       ...prevState.metadata,
        //       katib_metadata: metadata,
        //     },
        //   }));
        // updateVolumes = (
        //   volumes: IVolumeMetadata[],
        //   metadataVolumes: IVolumeMetadata[],
        // ) => {
        //   this.setState((prevState, props) => ({
        //     volumes,
        //     metadata: { ...prevState.metadata, volumes: metadataVolumes },
        //   }));
        // };
        // toggleKatibDialog = async () => {
        //   // When opening the katib dialog, we sent and RPC to Kale to parse the
        //   // current notebook to retrieve the pipeline parameters. In case the
        //   // notebook is in an unsaved state, ask the user to save it.
        //   if (!this.state.katibDialog) {
        //     await NotebookUtils.saveNotebook(this.getActiveNotebook(), true, true);
        //     // if the notebook is saved
        //     if (!this.getActiveNotebook().context.model.dirty) {
        //       this.setState({ katibDialog: true });
        //     }
        //   } else {
        //     // close
        //     this.setState({ katibDialog: false });
        //   }
        // };
        // restore state to default values
        this.resetState = () => this.setState((prevState, props) => ({
            ...DefaultState,
            isEnabled: prevState.isEnabled,
        }));
        this.componentDidMount = () => {
            // Notebook tracker will signal when a notebook is changed
            this.props.tracker.currentChanged.connect(this.handleNotebookChanged, this);
            // Set notebook widget if one is open
            if (this.props.tracker.currentWidget instanceof _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__.NotebookPanel) {
                this.setNotebookPanel(this.props.tracker.currentWidget);
            }
        };
        this.componentDidUpdate = (prevProps, prevState) => {
            // fast comparison of Metadata objects.
            // warning: this method does not work if keys change order.
            if (JSON.stringify(prevState.metadata) !==
                JSON.stringify(this.state.metadata) &&
                this.getActiveNotebook()) {
                const activeNotebook = this.getActiveNotebook();
                if (activeNotebook) {
                    // Write new metadata to the notebook and save
                    _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].setMetaData(activeNotebook, KALE_NOTEBOOK_METADATA_KEY, this.state.metadata, true);
                }
            }
        };
        /**
         * This handles when a notebook is switched to another notebook.
         * The parameters are automatically passed from the signal when a switch occurs.
         */
        this.handleNotebookChanged = async (tracker, notebook) => {
            // Set the current notebook and wait for the session to be ready
            if (notebook) {
                await this.setNotebookPanel(notebook);
            }
            else {
                // Handle null case - reset to default state
                this.resetState();
            }
        };
        /**
         * Read new notebook and assign its metadata to the state.
         * @param notebook active NotebookPanel
         */
        this.setNotebookPanel = async (notebook) => {
            // if there at least an open notebook
            if (this.props.tracker.size > 0 && notebook) {
                const commands = new _lib_Commands__WEBPACK_IMPORTED_MODULE_10__["default"](notebook, this.props.kernel);
                // wait for the session to be ready before reading metadata
                await notebook.sessionContext.ready;
                // get notebook metadata
                const notebookMetadata = _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_2__["default"].getMetaData(notebook, KALE_NOTEBOOK_METADATA_KEY);
                console.log('Kubeflow metadata:');
                console.log(notebookMetadata);
                if (this.props.backend) {
                    // Retrieve the notebook's namespace
                    this.setState({ namespace: await commands.getNamespace() });
                    // Detect whether this is an exploration, i.e., recovery from snapshot
                    const nbFilePath = this.getActiveNotebookPath();
                    if (nbFilePath) {
                        await commands.resumeStateIfExploreNotebook(nbFilePath);
                    }
                    // if (!this.props.rokError) {
                    //   // Get information about volumes currently mounted on the notebook server
                    //   const {
                    //     notebookVolumes,
                    //     selectVolumeTypes,
                    //   } = await commands.getMountedVolumes(this.state.notebookVolumes);
                    //   this.setState({
                    //     notebookVolumes,
                    //     selectVolumeTypes,
                    //   });
                    // } else {
                    //   this.setState((prevState, props) => ({
                    //     selectVolumeTypes: prevState.selectVolumeTypes.map(t => {
                    //       return t.value === 'clone' || t.value === 'snap'
                    //         ? { ...t, tooltip: rokErrorTooltip(this.props.rokError) }
                    //         : t;
                    //     }),
                    //   }));
                    // }
                    // Detect the base image of the current Notebook Server
                    const baseImage = await commands.getBaseImage();
                    if (baseImage) {
                        DefaultState.metadata.docker_image = baseImage;
                    }
                    else {
                        DefaultState.metadata.docker_image = '';
                    }
                    // Detect poddefault labels applied on server and add them as steps defaults
                    // fixme: This RPC could be called just when starting the widget
                    //        and not every time we set a new notebook
                    // const podDefaultLabels = await commands.findPodDefaultLabelsOnServer();
                    // Object.keys(podDefaultLabels)
                    //   .map(key => `label:${key}:${podDefaultLabels[key]}`)
                    //   .forEach(label => {
                    //     if (!DefaultState.metadata.steps_defaults?.includes(label)) {
                    //       DefaultState.metadata.steps_defaults?.push(label);
                    //     }
                    //   });
                    // Get experiment information last because it may take more time to respond
                    this.setState({ gettingExperiments: true });
                    const { experiments, experiment, experiment_name, } = await commands.getExperiments(this.state.metadata.experiment, this.state.metadata.experiment_name);
                    this.setState((prevState, props) => ({
                        experiments,
                        gettingExperiments: false,
                        metadata: {
                            ...prevState.metadata,
                            experiment,
                            experiment_name,
                        },
                    }));
                }
                // ********Commenting to just make the build run**********
                // if the key exists in the notebook's metadata
                if (notebookMetadata) {
                    let experiment = { id: '', name: '' };
                    let experiment_name = '';
                    if (notebookMetadata['experiment']) {
                        experiment = {
                            id: notebookMetadata['experiment']['id'] || '',
                            name: notebookMetadata['experiment']['name'] || '',
                        };
                        experiment_name = notebookMetadata['experiment']['name'];
                    }
                    else if (notebookMetadata['experiment_name']) {
                        const matchingExperiments = this.state.experiments.filter(e => e.name === notebookMetadata['experiment_name']);
                        if (matchingExperiments.length > 0) {
                            experiment = matchingExperiments[0];
                        }
                        else {
                            experiment = {
                                id: NEW_EXPERIMENT.id,
                                name: notebookMetadata['experiment_name'],
                            };
                        }
                        experiment_name = notebookMetadata['experiment_name'];
                    }
                    else {
                        this.resetState();
                    }
                    //     let metadataVolumes = (notebookMetadata['volumes'] || []).filter(
                    //       (v: IVolumeMetadata) => v.type !== 'clone',
                    //     );
                    //     let stateVolumes = this.props.rokError
                    //       ? metadataVolumes
                    //       : metadataVolumes.map((volume: IVolumeMetadata) => {
                    //           if (
                    //             volume.type === 'new_pvc' &&
                    //             volume.annotations.length > 0 &&
                    //             volume.annotations[0].key === 'rok/origin'
                    //           ) {
                    //             return { ...volume, type: 'snap' };
                    //           }
                    //           return volume;
                    //         });
                    //     if (stateVolumes.length === 0 && metadataVolumes.length === 0) {
                    //       metadataVolumes = stateVolumes = this.state.notebookVolumes;
                    //     } else {
                    //       metadataVolumes = metadataVolumes.concat(this.state.notebookVolumes);
                    //       stateVolumes = stateVolumes.concat(this.state.notebookVolumes);
                    //     }
                    let metadata = {
                        ...notebookMetadata,
                        experiment: experiment,
                        experiment_name: experiment_name,
                        pipeline_name: notebookMetadata['pipeline_name'] || '',
                        pipeline_description: notebookMetadata['pipeline_description'] || '',
                        docker_image: notebookMetadata['docker_image'] ||
                            DefaultState.metadata.docker_image,
                        steps_defaults: DefaultState.metadata.steps_defaults,
                    };
                    this.setState({
                        metadata: metadata,
                    });
                }
                else {
                    this.setState((prevState, props) => ({
                        metadata: {
                            ...DefaultState.metadata
                        }
                    }));
                }
            }
            else {
                this.resetState();
            }
        };
        this.updateDeployProgress = (index, progress) => {
            let deploy;
            if (!this.state.deploys[index]) {
                deploy = { [index]: progress };
            }
            else {
                deploy = { [index]: { ...this.state.deploys[index], ...progress } };
            }
            this.setState({ deploys: { ...this.state.deploys, ...deploy } });
        };
        this.onPanelRemove = (index) => {
            const deploys = { ...this.state.deploys };
            deploys[index].deleted = true;
            this.setState({ deploys });
        };
        this.runDeploymentCommand = async () => {
            const activeNotebook = this.getActiveNotebook();
            if (!activeNotebook) {
                this.setState({ runDeployment: false });
                return;
            }
            await activeNotebook.context.save();
            const commands = new _lib_Commands__WEBPACK_IMPORTED_MODULE_10__["default"](activeNotebook, this.props.kernel);
            const _deployIndex = ++deployIndex;
            const _updateDeployProgress = (x) => {
                this.updateDeployProgress(_deployIndex, {
                    ...x,
                    namespace: this.state.namespace,
                });
            };
            const metadata = JSON.parse(JSON.stringify(this.state.metadata)); // Deepcopy metadata
            // assign the default docker image in case it is empty
            if (metadata.docker_image === '') {
                metadata.docker_image = DefaultState.metadata.docker_image;
            }
            const nbFilePath = this.getActiveNotebookPath();
            if (!nbFilePath) {
                // Handle the error, show a message, or return early
                const extendedProgress = {
                    message: 'No active notebook path found.',
                };
                _updateDeployProgress(extendedProgress);
                this.setState({ runDeployment: false });
                return;
            }
            // VALIDATE METADATA
            const validationSucceeded = await commands.validateMetadata(nbFilePath, metadata, _updateDeployProgress);
            if (!validationSucceeded) {
                this.setState({ runDeployment: false });
                return;
            }
            _updateDeployProgress({
                message: 'Validation completed successfully',
            });
            // SNAPSHOT VOLUMES
            // if (
            //   metadata.volumes.filter((v: IVolumeMetadata) => v.type === 'clone')
            //     .length > 0
            // ) {
            //   const task = await commands.runSnapshotProcedure(_updateDeployProgress);
            //   console.log(task);
            //   if (!task) {
            //     this.setState({ runDeployment: false });
            //     return;
            //   }
            //   metadata.volumes = await commands.replaceClonedVolumes(
            //     task.bucket,
            //     task.result.event.object,
            //     task.result.event.version,
            //     metadata.volumes,
            //   );
            // }
            // CREATE PIPELINE
            const compileNotebook = await commands.compilePipeline(nbFilePath, metadata, this.props.docManager, this.state.deployDebugMessage, _updateDeployProgress);
            if (!compileNotebook) {
                this.setState({ runDeployment: false });
                return;
            }
            _updateDeployProgress({
                message: 'Notebook compiled successfully',
            });
            // UPLOAD
            const uploadPipeline = this.state.deploymentType === 'upload' ||
                this.state.deploymentType === 'run'
                ? await commands.uploadPipeline(compileNotebook.pipeline_package_path, compileNotebook.pipeline_metadata, _updateDeployProgress)
                : null;
            if (!uploadPipeline) {
                this.setState({ runDeployment: false });
                _updateDeployProgress({ pipeline: false });
                return;
            }
            _updateDeployProgress({
                message: 'Pipeline uploaded successfully',
                pipeline: true,
            });
            // RUN
            if (this.state.deploymentType === 'run') {
                // if (metadata.katib_run) {
                //   try {
                //     const katibExperiment = await commands.runKatib(
                //       nbFilePath,
                //       metadata,
                //       uploadPipeline.pipeline.pipelineid,
                //       uploadPipeline.pipeline.versionid,
                //       _updateDeployProgress,
                //     );
                //     commands.pollKatib(katibExperiment, _updateDeployProgress);
                //   } catch (error) {
                //     this.setState({ runDeployment: false });
                //     throw error;
                //   }
                // } else {
                const runPipeline = await commands.runPipeline(uploadPipeline.pipeline.pipelineid, uploadPipeline.pipeline.versionid, compileNotebook.pipeline_metadata, compileNotebook.pipeline_package_path, _updateDeployProgress);
                if (runPipeline) {
                    commands.pollRun(runPipeline, _updateDeployProgress);
                }
            }
            // stop deploy button icon spin
            this.setState({ runDeployment: false });
        };
        this.onMetadataEnable = (isEnabled) => {
            this.setState({ isEnabled });
        };
    }
    render() {
        // FIXME: What about human-created Notebooks? Match name and old API as well
        const selectedExperiments = this.state.experiments.filter(e => e.id === this.state.metadata.experiment.id ||
            e.name === this.state.metadata.experiment.name);
        if (this.state.experiments.length > 0 && selectedExperiments.length === 0) {
            selectedExperiments.push(this.state.experiments[0]);
        }
        let experimentInputSelected = '';
        let experimentInputValue = '';
        if (selectedExperiments.length > 0) {
            experimentInputSelected = selectedExperiments[0].id;
            if (selectedExperiments[0].id === NEW_EXPERIMENT.id) {
                if (this.state.metadata.experiment.name !== '') {
                    experimentInputValue = this.state.metadata.experiment.name;
                }
                else {
                    experimentInputValue = this.state.metadata.experiment_name;
                }
            }
            else {
                experimentInputValue = selectedExperiments[0].name;
            }
        }
        const experiment_name_input = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_ExperimentInput__WEBPACK_IMPORTED_MODULE_5__.ExperimentInput, { updateValue: this.updateExperiment, options: this.state.experiments, selected: experimentInputSelected, value: experimentInputValue, loading: this.state.gettingExperiments }));
        const pipeline_name_input = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_Input__WEBPACK_IMPORTED_MODULE_9__.Input, { variant: "standard", label: 'Pipeline Name', updateValue: this.updatePipelineName, value: this.state.metadata.pipeline_name, regex: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$', regexErrorMsg: "Pipeline name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character." }));
        const pipeline_desc_input = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_Input__WEBPACK_IMPORTED_MODULE_9__.Input, { variant: "standard", label: 'Pipeline Description', updateValue: this.updatePipelineDescription, value: this.state.metadata.pipeline_description }));
        // const katib_run_input = (
        //   <div className="input-container">
        //     <LightTooltip
        //       title={'Enable this option to run HyperParameter Tuning with Katib'}
        //       placement="top-start"
        //       interactive={true}
        //       TransitionComponent={Zoom}
        //     >
        //       <div className="toolbar">
        //         <div className="switch-label">HP Tuning with Katib</div>
        //         <Switch
        //           checked={this.state.metadata.katib_run}
        //           onChange={_ => this.updateKatibRun()}
        //           color="primary"
        //           name="enableKatib"
        //           className="material-switch"
        //           inputProps={{ 'aria-label': 'primary checkbox' }}
        //         />
        //       </div>
        //     </LightTooltip>
        //   </div>
        // );
        // const volsPanel = (
        //   <VolumesPanel
        //     volumes={this.state.volumes}
        //     notebookVolumes={this.state.notebookVolumes}
        //     metadataVolumes={this.state.metadata.volumes}
        //     notebookMountPoints={this.getNotebookMountPoints()}
        //     selectVolumeTypes={this.state.selectVolumeTypes}
        //     useNotebookVolumes={this.state.metadata.snapshot_volumes}
        //     updateVolumesSwitch={this.updateVolumesSwitch}
        //     autosnapshot={this.state.metadata.autosnapshot}
        //     updateAutosnapshotSwitch={this.updateAutosnapshotSwitch}
        //     rokError={this.props.rokError}
        //     updateVolumes={this.updateVolumes}
        //     storageClassName={this.state.metadata.storage_class_name}
        //     updateStorageClassName={this.updateStorageClassName}
        //     volumeAccessMode={this.state.metadata.volume_access_mode}
        //     updateVolumeAccessMode={this.updateVolumeAccessMode}
        //   />
        // );
        const activeNotebook = this.getActiveNotebook();
        return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material_styles__WEBPACK_IMPORTED_MODULE_7__["default"], { theme: _Theme__WEBPACK_IMPORTED_MODULE_8__.theme },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kubeflow-widget', key: "kale-widget" },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kubeflow-widget-content' },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null,
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement("p", { style: {
                                fontSize: 'var(--jp-ui-font-size3)',
                                color: _Theme__WEBPACK_IMPORTED_MODULE_8__.theme.kale.headers.main,
                            }, className: "kale-header" },
                            "Kale Deployment Panel ",
                            this.state.isEnabled)),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "kale-component" }, activeNotebook && (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_cell_metadata_InlineCellMetadata__WEBPACK_IMPORTED_MODULE_3__.InlineCellsMetadata, { onMetadataEnable: this.onMetadataEnable, notebook: activeNotebook }))),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kale-component ' + (this.state.isEnabled ? '' : 'hidden') },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null,
                            react__WEBPACK_IMPORTED_MODULE_0__.createElement("p", { className: "kale-header", style: { color: _Theme__WEBPACK_IMPORTED_MODULE_8__.theme.kale.headers.main } }, "Pipeline Metadata")),
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'input-container' },
                            experiment_name_input,
                            pipeline_name_input,
                            pipeline_desc_input)),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kale-component ' + (this.state.isEnabled ? '' : 'hidden') })),
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: this.state.isEnabled ? '' : 'hidden', style: { marginTop: 'auto' } },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_deploys_progress_DeploysProgress__WEBPACK_IMPORTED_MODULE_6__.DeploysProgress, { deploys: this.state.deploys, onPanelRemove: this.onPanelRemove }),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_DeployButton__WEBPACK_IMPORTED_MODULE_4__.SplitDeployButton, { running: this.state.runDeployment, handleClick: this.activateRunDeployState })))));
    }
}


/***/ }),

/***/ "./lib/widgets/cell-metadata/CellMetadataEditor.js":
/*!*********************************************************!*\
  !*** ./lib/widgets/cell-metadata/CellMetadataEditor.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CellMetadataEditor: () => (/* binding */ CellMetadataEditor),
/* harmony export */   RESERVED_CELL_NAMES: () => (/* binding */ RESERVED_CELL_NAMES),
/* harmony export */   RESERVED_CELL_NAMES_CHIP_COLOR: () => (/* binding */ RESERVED_CELL_NAMES_CHIP_COLOR),
/* harmony export */   RESERVED_CELL_NAMES_HELP_TEXT: () => (/* binding */ RESERVED_CELL_NAMES_HELP_TEXT)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/TagsUtils */ "./lib/lib/TagsUtils.js");
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/cells */ "webpack/sharing/consume/default/@jupyterlab/cells");
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _mui_icons_material_Close__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @mui/icons-material/Close */ "./node_modules/@mui/icons-material/esm/Close.js");
/* harmony import */ var _lib_ColorUtils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../lib/ColorUtils */ "./lib/lib/ColorUtils.js");
/* harmony import */ var _lib_CellMetadataContext__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../lib/CellMetadataContext */ "./lib/lib/CellMetadataContext.js");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _CellMetadataEditorDialog__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./CellMetadataEditorDialog */ "./lib/widgets/cell-metadata/CellMetadataEditorDialog.js");
/* harmony import */ var _components_Input__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../components/Input */ "./lib/components/Input.js");
/* harmony import */ var _components_Select__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../components/Select */ "./lib/components/Select.js");
/* harmony import */ var _components_SelectMulti__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../components/SelectMulti */ "./lib/components/SelectMulti.js");
/*
 * Copyright 2019-2020 The Kale Authors
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











const CELL_TYPES = [
    { value: 'imports', label: 'Imports' },
    { value: 'functions', label: 'Functions' },
    { value: 'pipeline-parameters', label: 'Pipeline Parameters' },
    { value: 'pipeline-metrics', label: 'Pipeline Metrics' },
    { value: 'step', label: 'Pipeline Step' },
    { value: 'skip', label: 'Skip Cell' },
];
const RESERVED_CELL_NAMES = [
    'imports',
    'functions',
    'pipeline-parameters',
    'pipeline-metrics',
    'skip',
];
const RESERVED_CELL_NAMES_HELP_TEXT = {
    imports: 'The code in this cell will be pre-pended to every step of the pipeline.',
    functions: 'The code in this cell will be pre-pended to every step of the pipeline,' +
        ' after `imports`.',
    'pipeline-parameters': 'The variables in this cell will be transformed into pipeline parameters,' +
        ' preserving the current values as defaults.',
    'pipeline-metrics': 'The variables in this cell will be transformed into pipeline metrics.',
    skip: 'This cell will be skipped and excluded from pipeline steps',
};
const RESERVED_CELL_NAMES_CHIP_COLOR = {
    skip: 'a9a9a9',
    'pipeline-parameters': 'ee7a1a',
    'pipeline-metrics': '773d0d',
    imports: 'a32626',
    functions: 'a32626',
};
const STEP_NAME_ERROR_MSG = `Step name must consist of lower case alphanumeric
 characters or \'_\', and can not start with a digit.`;
const DefaultState = {
    previousStepName: undefined,
    stepNameErrorMsg: STEP_NAME_ERROR_MSG,
    blockDependenciesChoices: [],
    cellMetadataEditorDialog: false,
};
/**
 * Component that allow to edit the Kale cell tags of a notebook cell.
 */
class CellMetadataEditor extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(props) {
        super(props);
        this.updateCurrentCellType = (value) => {
            if (RESERVED_CELL_NAMES.includes(value)) {
                this.updateCurrentBlockName(value);
            }
            else {
                _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].resetCell(this.props.notebook, this.context.activeCellIndex, this.props.stepName || '');
            }
        };
        this.updateCurrentBlockName = (value) => {
            const oldBlockName = this.props.stepName || '';
            let currentCellMetadata = {
                prevBlockNames: this.props.stepDependencies,
                limits: this.props.limits || {},
                blockName: value,
            };
            _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].setKaleCellTags(this.props.notebook, this.context.activeCellIndex, currentCellMetadata, false).then((oldValue) => {
                _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].updateKaleCellsTags(this.props.notebook, oldBlockName, value);
            });
        };
        /**
         * Even handler of the MultiSelect used to select the dependencies of a block
         */
        this.updatePrevBlocksNames = (previousBlocks) => {
            let currentCellMetadata = {
                blockName: this.props.stepName || '',
                limits: this.props.limits || {},
                prevBlockNames: previousBlocks,
            };
            _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].setKaleCellTags(this.props.notebook, this.context.activeCellIndex, currentCellMetadata, true);
        };
        /**
         * Event triggered when the the CellMetadataEditorDialog dialog is closed
         */
        this.updateCurrentLimits = (actions) => {
            let limits = { ...this.props.limits };
            actions.forEach(action => {
                if (action.action === 'update' && action.limitValue !== undefined) {
                    limits[action.limitKey] = action.limitValue;
                }
                if (action.action === 'delete' &&
                    Object.keys(this.props.limits || {}).includes(action.limitKey)) {
                    delete limits[action.limitKey];
                }
            });
            let currentCellMetadata = {
                blockName: this.props.stepName || '',
                prevBlockNames: this.props.stepDependencies,
                limits: limits,
            };
            _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].setKaleCellTags(this.props.notebook, this.context.activeCellIndex, currentCellMetadata, true);
        };
        /**
         * Function called before updating the value of the block name input text
         * field. It acts as a validator.
         */
        this.onBeforeUpdate = (value) => {
            if (value === this.props.stepName) {
                return false;
            }
            const blockNames = _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].getAllBlocks(this.props.notebook.content);
            if (blockNames.includes(value)) {
                this.setState({ stepNameErrorMsg: 'This name already exists.' });
                return true;
            }
            this.setState({ stepNameErrorMsg: STEP_NAME_ERROR_MSG });
            return false;
        };
        this.getPrevStepNotice = () => {
            return this.state.previousStepName && this.props.stepName === ''
                ? `Leave the step name empty to merge the cell to step '${this.state.previousStepName}'`
                : null;
        };
        // We use this element reference in order to move it inside Notebooks's cell
        // element.
        this.editorRef = react__WEBPACK_IMPORTED_MODULE_0__.createRef();
        this.state = DefaultState;
        this.updateCurrentBlockName = this.updateCurrentBlockName.bind(this);
        this.updateCurrentCellType = this.updateCurrentCellType.bind(this);
        this.updatePrevBlocksNames = this.updatePrevBlocksNames.bind(this);
        this.toggleTagsEditorDialog = this.toggleTagsEditorDialog.bind(this);
    }
    componentWillUnmount() {
        const editor = this.editorRef.current;
        if (editor) {
            editor.remove();
        }
    }
    isEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    /**
     * When the activeCellIndex of the editor changes, the editor needs to be
     * moved to the correct position.
     */
    moveEditor() {
        var _a;
        if (!this.props.notebook) {
            return;
        }
        // get the HTML element corresponding to the current active cell
        const notebookContent = this.props.notebook.content;
        if (!((_a = notebookContent === null || notebookContent === void 0 ? void 0 : notebookContent.node) === null || _a === void 0 ? void 0 : _a.childNodes)) {
            return;
        }
        const metadataWrapper = notebookContent.node.childNodes[this.context.activeCellIndex];
        if (!metadataWrapper) {
            return;
        }
        const editor = this.editorRef.current;
        const inlineElement = metadataWrapper.querySelector('.kale-inline-cell-metadata');
        const elem = metadataWrapper.querySelector('.moved');
        if (editor && elem && !elem.querySelector('.kale-metadata-editor-wrapper') && inlineElement) {
            elem.insertBefore(editor, inlineElement.nextSibling);
        }
    }
    componentDidUpdate(prevProps, prevState) {
        this.hideEditorIfNotCodeCell();
        this.moveEditor();
        // this.setState(this.updateBlockDependenciesChoices);
        // this.setState(this.updatePreviousStepName);
        const dependenciesState = this.updateBlockDependenciesChoices(this.state, this.props);
        if (dependenciesState) {
            this.setState(dependenciesState);
        }
        const previousStepState = this.updatePreviousStepName(this.state, this.props);
        if (previousStepState) {
            this.setState(previousStepState);
        }
    }
    hideEditorIfNotCodeCell() {
        if (this.props.notebook && !this.props.notebook.isDisposed && this.props.notebook.model) {
            const cellModel = this.props.notebook.model.cells.get(this.context.activeCellIndex);
            if (!(0,_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_2__.isCodeCellModel)(cellModel) && this.context.isEditorVisible) {
                this.closeEditor();
            }
        }
    }
    /**
     * Scan the notebook for all block tags and get them all, excluded the current
     * one (and the reserved cell tags) The value `previousBlockChoices` is used
     * by the dependencies select option to select the current step's
     * dependencies.
     */
    updateBlockDependenciesChoices(state, props) {
        if (!props.notebook) {
            return null;
        }
        const allBlocks = _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].getAllBlocks(props.notebook.content);
        const dependencyChoices = allBlocks
            // remove all reserved names and current step name
            .filter(el => !RESERVED_CELL_NAMES.includes(el) && !(el === props.stepName))
            .map(name => ({ value: name, color: `#${_lib_ColorUtils__WEBPACK_IMPORTED_MODULE_4__["default"].getColor(name)}` }));
        if (this.isEqual(state.blockDependenciesChoices, dependencyChoices)) {
            return null;
        }
        // XXX (stefano): By setting state.cellMetadataEditorDialog NOT optional,
        // XXX (stefano): this return will require cellMetadataEditorDialog.
        return { blockDependenciesChoices: dependencyChoices };
    }
    updatePreviousStepName(state, props) {
        if (!props.notebook) {
            return null;
        }
        const prevBlockName = _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_1__["default"].getPreviousBlock(props.notebook.content, this.context.activeCellIndex);
        if (prevBlockName === this.state.previousStepName) {
            return null;
        }
        // XXX (stefano): By setting state.cellMetadataEditorDialog NOT optional,
        // XXX (stefano): this return will require cellMetadataEditorDialog.
        return { previousStepName: prevBlockName };
    }
    /**
     * Event handler of close button, positioned on the top right of the cell
     */
    closeEditor() {
        this.context.onEditorVisibilityChange(false);
    }
    toggleTagsEditorDialog() {
        this.setState({
            cellMetadataEditorDialog: !this.state.cellMetadataEditorDialog,
        });
    }
    render() {
        const cellType = RESERVED_CELL_NAMES.includes(this.props.stepName || '')
            ? this.props.stepName
            : 'step';
        const cellColor = this.props.stepName
            ? `#${_lib_ColorUtils__WEBPACK_IMPORTED_MODULE_4__["default"].getColor(this.props.stepName)}`
            : 'transparent';
        const prevStepNotice = this.getPrevStepNotice();
        return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null,
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kale-metadata-editor-wrapper' +
                        (this.context.isEditorVisible ? ' opened' : '') +
                        (cellType === 'step' ? ' kale-is-step' : ''), ref: this.editorRef },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kale-cell-metadata-editor' +
                            (this.context.isEditorVisible ? '' : ' hidden'), style: { borderLeft: `2px solid ${cellColor}` } },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_Select__WEBPACK_IMPORTED_MODULE_9__.Select, { updateValue: this.updateCurrentCellType, values: CELL_TYPES, value: cellType || 'step', label: 'Cell type', index: 0, variant: "outlined", style: { width: '30%' } }),
                        cellType === 'step' ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_Input__WEBPACK_IMPORTED_MODULE_8__.Input, { label: 'Step name', updateValue: this.updateCurrentBlockName, value: this.props.stepName || '', regex: '^([_a-z]([_a-z0-9]*)?)?$', regexErrorMsg: this.state.stepNameErrorMsg, variant: "outlined", onBeforeUpdate: this.onBeforeUpdate, style: { width: '30%' } })) : (''),
                        cellType === 'step' ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_SelectMulti__WEBPACK_IMPORTED_MODULE_10__.SelectMulti, { id: "select-previous-blocks", label: "Depends on", disabled: !(this.props.stepName && this.props.stepName.length > 0), updateSelected: this.updatePrevBlocksNames, options: this.state.blockDependenciesChoices, variant: "outlined", selected: this.props.stepDependencies || [], style: { width: '35%' } })) : (''),
                        cellType === 'step' ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { style: { padding: 0 } },
                            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_6__.Button, { disabled: !(this.props.stepName && this.props.stepName.length > 0), color: "primary", variant: "contained", size: "small", title: "GPU", onClick: () => this.toggleTagsEditorDialog(), style: { width: '5%' } }, "GPU"))) : (''),
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_6__.IconButton, { "aria-label": "delete", onClick: () => this.closeEditor() },
                            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Close__WEBPACK_IMPORTED_MODULE_3__["default"], { fontSize: "small" }))),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kale-cell-metadata-editor-helper-text' +
                            (this.context.isEditorVisible ? '' : ' hidden') },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement("p", null, prevStepNotice)))),
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_CellMetadataEditorDialog__WEBPACK_IMPORTED_MODULE_7__.CellMetadataEditorDialog, { open: this.state.cellMetadataEditorDialog, toggleDialog: this.toggleTagsEditorDialog, stepName: this.props.stepName || '', limits: this.props.limits || {}, updateLimits: this.updateCurrentLimits })));
    }
}
CellMetadataEditor.contextType = _lib_CellMetadataContext__WEBPACK_IMPORTED_MODULE_5__.CellMetadataContext;


/***/ }),

/***/ "./lib/widgets/cell-metadata/CellMetadataEditorDialog.js":
/*!***************************************************************!*\
  !*** ./lib/widgets/cell-metadata/CellMetadataEditorDialog.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CellMetadataEditorDialog: () => (/* binding */ CellMetadataEditorDialog)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_ColorUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../lib/ColorUtils */ "./lib/lib/ColorUtils.js");
/* harmony import */ var _components_Input__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../components/Input */ "./lib/components/Input.js");
/* harmony import */ var _components_Select__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../components/Select */ "./lib/components/Select.js");
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





const GPU_TYPES = [
    { value: 'nvidia.com/gpu', label: 'Nvidia' },
    { value: 'amd.com/gpu', label: 'AMD' },
];
const DEFAULT_GPU_TYPE = GPU_TYPES[0].value;
const CellMetadataEditorDialog = props => {
    const handleClose = () => {
        props.toggleDialog();
    };
    const limitAction = (action, limitKey, limitValue = null) => {
        return {
            action,
            limitKey,
            limitValue,
        };
    };
    // intersect the current limits and the GPU_TYPES. Assume there is at most 1.
    const gpuType = Object.keys(props.limits).filter(x => GPU_TYPES.map(t => t.value).includes(x))[0] || undefined;
    const gpuCount = props.limits[gpuType] || undefined;
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Dialog, { open: props.open, onClose: handleClose, fullWidth: true, maxWidth: 'sm', scroll: "paper", "aria-labelledby": "scroll-dialog-title", "aria-describedby": "scroll-dialog-description" },
        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.DialogTitle, { id: "scroll-dialog-title" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Grid, { container: true, sx: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                } },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Grid, { size: { xs: 9 } },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                        } },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement("p", null, "Require GPU for step "),
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Chip, { className: 'kale-chip', style: {
                                marginLeft: '10px',
                                backgroundColor: `#${_lib_ColorUtils__WEBPACK_IMPORTED_MODULE_2__["default"].getColor(props.stepName)}`,
                            }, key: props.stepName, label: props.stepName }))),
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Grid, { size: { xs: 3 } },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Box, { sx: {
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                        } },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Switch, { checked: gpuType !== undefined, onChange: c => {
                                if (c.target.checked) {
                                    // default value
                                    props.updateLimits([
                                        limitAction('update', DEFAULT_GPU_TYPE, '1'),
                                    ]);
                                }
                                else {
                                    if (gpuType) {
                                        props.updateLimits([limitAction('delete', gpuType)]);
                                    }
                                }
                            }, color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' }, classes: { root: 'material-switch' } }))))),
        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.DialogContent, { dividers: true, style: { paddingTop: 0 } },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Grid, { container: true, sx: { flexDirection: 'column', justifyContent: 'center', alignItems: 'center' } },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Grid, { container: true, sx: {
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '15px',
                    } },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Grid, { size: { xs: 6 } },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_Input__WEBPACK_IMPORTED_MODULE_3__.Input, { disabled: gpuType === undefined, variant: "outlined", label: "GPU Count", value: gpuCount || 1, updateValue: (v) => {
                                if (gpuType) {
                                    props.updateLimits([limitAction('update', gpuType, v)]);
                                }
                            }, style: { width: '95%' } })),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Grid, { size: { xs: 6 } },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_components_Select__WEBPACK_IMPORTED_MODULE_4__.Select, { disabled: gpuType === undefined, updateValue: (v) => {
                                const actions = [];
                                if (gpuType) {
                                    actions.push(limitAction('delete', gpuType));
                                }
                                actions.push(limitAction('update', v, gpuCount));
                                props.updateLimits(actions);
                            }, values: GPU_TYPES, value: gpuType || DEFAULT_GPU_TYPE, label: "GPU Type", index: 0, variant: "outlined" }))))),
        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.DialogActions, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Button, { onClick: handleClose, color: "primary" }, "Ok"))));
};


/***/ }),

/***/ "./lib/widgets/cell-metadata/InlineCellMetadata.js":
/*!*********************************************************!*\
  !*** ./lib/widgets/cell-metadata/InlineCellMetadata.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InlineCellsMetadata: () => (/* binding */ InlineCellsMetadata)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/cells */ "webpack/sharing/consume/default/@jupyterlab/cells");
/* harmony import */ var _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_CellUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../lib/CellUtils */ "./lib/lib/CellUtils.js");
/* harmony import */ var _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../lib/TagsUtils */ "./lib/lib/TagsUtils.js");
/* harmony import */ var _InlineMetadata__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./InlineMetadata */ "./lib/widgets/cell-metadata/InlineMetadata.js");
/* harmony import */ var _CellMetadataEditor__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./CellMetadataEditor */ "./lib/widgets/cell-metadata/CellMetadataEditor.js");
/* harmony import */ var _lib_CellMetadataContext__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../lib/CellMetadataContext */ "./lib/lib/CellMetadataContext.js");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../lib/NotebookUtils */ "./lib/lib/NotebookUtils.js");
/*
 * Copyright 2019-2020 The Kale Authors
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









const DefaultState = {
    activeCellIndex: 0,
    prevBlockName: undefined,
    metadataCmp: [],
    checked: false,
    editors: {},
    isEditorVisible: false,
};
class InlineCellsMetadata extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(props) {
        super(props);
        this.state = DefaultState;
        this.componentDidMount = () => {
            if (this.props.notebook) {
                this.connectAndInitWhenReady(this.props.notebook);
            }
        };
        this.componentDidUpdate = async (prevProps, prevState) => {
            if (!this.props.notebook && prevProps.notebook) {
                // no notebook
                this.clearEditorsPropsAndInlineMetadata();
            }
            const preNotebookId = prevProps.notebook ? prevProps.notebook.id : '';
            const notebookId = this.props.notebook ? this.props.notebook.id : '';
            if (preNotebookId !== notebookId) {
                // notebook changed
                if (prevProps.notebook) {
                    this.disconnectHandlersFromNotebook(prevProps.notebook);
                }
                if (this.props.notebook) {
                    this.connectAndInitWhenReady(this.props.notebook);
                }
                // hide editor on notebook change
                this.setState({ isEditorVisible: false });
            }
        };
        this.connectAndInitWhenReady = (notebook) => {
            notebook.context.ready.then(() => {
                this.connectHandlersToNotebook(this.props.notebook);
                this.refreshEditorsPropsAndInlineMetadata();
                this.setState({
                    activeCellIndex: notebook.content.activeCellIndex,
                });
            });
        };
        this.connectHandlersToNotebook = (notebook) => {
            notebook.context.saveState.connect(this.handleSaveState);
            notebook.content.activeCellChanged.connect(this.onActiveCellChanged);
            if (notebook.model) {
                notebook.model.cells.changed.connect(this.handleCellChange);
            }
        };
        this.disconnectHandlersFromNotebook = (notebook) => {
            notebook.context.saveState.disconnect(this.handleSaveState);
            notebook.content.activeCellChanged.disconnect(this.onActiveCellChanged);
            // when closing the notebook tab, notebook.model becomes null
            if (notebook.model) {
                notebook.model.cells.changed.disconnect(this.handleCellChange);
            }
        };
        this.onActiveCellChanged = (notebook, activeCell) => {
            this.setState({
                activeCellIndex: notebook.activeCellIndex,
            });
        };
        this.handleSaveState = (context, state) => {
            if (this.state.checked && state === 'completed') {
                this.generateEditorsPropsAndInlineMetadata();
            }
        };
        this.handleCellChange = (cells, args) => {
            this.refreshEditorsPropsAndInlineMetadata();
            const prevValue = args.oldValues[0];
            // Change type 'set' is when a cell changes its type. Even if a user changes
            // multiple cells using Shift + click the args.oldValues has only one cell
            // each time.
            if (args.type === 'set' && prevValue instanceof _jupyterlab_cells__WEBPACK_IMPORTED_MODULE_1__.CodeCellModel) {
                _lib_CellUtils__WEBPACK_IMPORTED_MODULE_2__["default"].setCellMetaData(this.props.notebook, args.newIndex, 'tags', [], true);
            }
            // Change type 'remove' is when a cell is removed from the notebook.
            if (args.type === 'remove') {
                _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_3__["default"].removeOldDependencies(this.props.notebook, prevValue);
            }
        };
        this.clearEditorsPropsAndInlineMetadata = (callback) => {
            // triggers cleanup in InlineMetadata
            this.setState({ metadataCmp: [], editors: {} }, () => {
                if (callback) {
                    callback();
                }
            });
        };
        this.generateEditorsPropsAndInlineMetadata = () => {
            if (!this.props.notebook || !this.props.notebook.model) {
                return;
            }
            const metadata = [];
            const editors = {};
            const cells = this.props.notebook.model.cells;
            for (let index = 0; index < cells.length; index++) {
                const cellModel = this.props.notebook.model.cells.get(index);
                const isCodeCell = (0,_jupyterlab_cells__WEBPACK_IMPORTED_MODULE_1__.isCodeCellModel)(cellModel);
                if (!isCodeCell) {
                    continue;
                }
                let tags = _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_3__["default"].getKaleCellTags(this.props.notebook.content, index);
                if (!tags) {
                    tags = {
                        blockName: '',
                        prevBlockNames: [],
                    };
                }
                let previousBlockName = '';
                if (!tags.blockName) {
                    previousBlockName = _lib_TagsUtils__WEBPACK_IMPORTED_MODULE_3__["default"].getPreviousBlock(this.props.notebook.content, index);
                }
                editors[index] = {
                    notebook: this.props.notebook,
                    stepName: tags.blockName || '',
                    stepDependencies: tags.prevBlockNames || [],
                    limits: tags.limits || {},
                };
                const cellElement = this.props.notebook.content.widgets[index].node;
                if (!cellElement) {
                    console.warn(`Failed to get cell element for index ${index}, skipping metadata creation`);
                    continue;
                }
                metadata.push(react__WEBPACK_IMPORTED_MODULE_0__.createElement(_InlineMetadata__WEBPACK_IMPORTED_MODULE_4__.InlineMetadata, { key: index, cellElement: cellElement, blockName: tags.blockName, stepDependencies: tags.prevBlockNames, limits: tags.limits || {}, previousBlockName: previousBlockName, cellIndex: index }));
            }
            this.setState({
                metadataCmp: metadata,
                editors: editors,
            });
        };
        this.onEditorVisibilityChange = this.onEditorVisibilityChange.bind(this);
    }
    /**
     * Event handler for the global Kale switch (the one below the Kale title in
     * the left panel). Enabling the switch propagates to the father component
     * (LeftPanel) to enable the rest of the UI.
     */
    toggleGlobalKaleSwitch(checked) {
        this.setState({ checked });
        this.props.onMetadataEnable(checked);
        if (checked) {
            this.generateEditorsPropsAndInlineMetadata();
            // When drawing cell metadata on Kale enable/disable, the targeted
            // cell may be lost. Therefore, we select and scroll to the active
            // cell.
            if (this.props.notebook &&
                this.props.notebook.content &&
                this.props.notebook.content.activeCellIndex !== undefined &&
                this.props.notebook.content.activeCellIndex >= 0) {
                const activeCell = this.props.notebook.content.activeCell;
                if (activeCell && activeCell.node) {
                    setTimeout(_lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_8__["default"].selectAndScrollToCell, 200, this.props.notebook, {
                        cell: activeCell,
                        index: this.props.notebook.content.activeCellIndex,
                    });
                }
            }
        }
        else {
            this.setState({ isEditorVisible: false });
            this.clearEditorsPropsAndInlineMetadata();
        }
    }
    refreshEditorsPropsAndInlineMetadata() {
        if (this.state.checked) {
            this.clearEditorsPropsAndInlineMetadata(() => {
                this.generateEditorsPropsAndInlineMetadata();
            });
            this.setState({ isEditorVisible: false });
        }
    }
    /**
     * Callback passed to the CellMetadataEditor context
     */
    onEditorVisibilityChange(isEditorVisible) {
        this.setState({ isEditorVisible });
    }
    render() {
        var _a;
        // Get the editor props of the active cell, so that just one editor is
        // rendered at any given time.
        const activeEditorData = (_a = this.state.editors) === null || _a === void 0 ? void 0 : _a[this.state.activeCellIndex];
        //notebook is always a NotebookPanel (never undefined)
        // stepName is always a string (never undefined)
        // stepDependencies is always a string array (never undefined)
        // limits is always an object (never undefined)
        const editorProps = activeEditorData ? {
            notebook: activeEditorData.notebook,
            stepName: activeEditorData.stepName || '',
            stepDependencies: activeEditorData.stepDependencies || [],
            limits: activeEditorData.limits || {},
        } : {
            notebook: this.props.notebook,
            stepName: '',
            stepDependencies: [],
            limits: {},
        };
        return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "toolbar input-container" },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'switch-label' }, "Enable"),
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_7__.Switch, { checked: this.state.checked, onChange: c => this.toggleGlobalKaleSwitch(c.target.checked), color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' }, classes: { root: 'material-switch' } })),
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "hidden" },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_lib_CellMetadataContext__WEBPACK_IMPORTED_MODULE_6__.CellMetadataContext.Provider, { value: {
                        activeCellIndex: this.state.activeCellIndex,
                        isEditorVisible: this.state.isEditorVisible,
                        onEditorVisibilityChange: this.onEditorVisibilityChange,
                    } },
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_5__.CellMetadataEditor, { notebook: editorProps.notebook, stepName: editorProps.stepName, stepDependencies: editorProps.stepDependencies, limits: editorProps.limits }),
                    this.state.metadataCmp))));
    }
}


/***/ }),

/***/ "./lib/widgets/cell-metadata/InlineMetadata.js":
/*!*****************************************************!*\
  !*** ./lib/widgets/cell-metadata/InlineMetadata.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InlineMetadata: () => (/* binding */ InlineMetadata)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_ColorUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../lib/ColorUtils */ "./lib/lib/ColorUtils.js");
/* harmony import */ var _CellMetadataEditor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./CellMetadataEditor */ "./lib/widgets/cell-metadata/CellMetadataEditor.js");
/* harmony import */ var _lib_CellMetadataContext__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../lib/CellMetadataContext */ "./lib/lib/CellMetadataContext.js");
/*
 * Copyright 2019-2020 The Kale Authors
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





const DefaultState = {
    cellTypeClass: '',
    color: '',
    dependencies: [],
    showEditor: false,
    isMergedCell: false,
};
// Check if an object is DOMElement
function isDOMElement(obj) {
    return obj &&
        typeof obj === 'object' &&
        obj.nodeType === 1 &&
        typeof obj.classList !== 'undefined' &&
        typeof obj.querySelector === 'function';
}
/**
 * This component is used by InlineCellMetadata to display some state information
 * on top of each cell that is tagged with Kale tags.
 *
 * When a cell is tagged with a step name and some dependencies, a chip with the
 * step name and a series of coloured dots for its dependencies are show.
 */
class InlineMetadata extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(props) {
        super(props);
        this.wrapperRef = null;
        this.state = DefaultState;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.updateEditorState = (state, props) => {
            let showEditor = false;
            if (this.context && this.context.isEditorVisible) {
                if (this.context.activeCellIndex === props.cellIndex) {
                    showEditor = true;
                }
            }
            if (showEditor === state.showEditor) {
                return null;
            }
            return { showEditor };
        };
        this.updateIsMergedState = (state, props) => {
            let newIsMergedCell = false;
            const cellElement = props.cellElement;
            // Debug logging
            // console.log('updateIsMergedState - cellElement:', cellElement);
            // console.log('updateIsMergedState - cellElement type:', typeof cellElement);
            // console.log('updateIsMergedState - has classList:', cellElement && 'classList' in cellElement);
            if (!props.blockName) {
                newIsMergedCell = true;
                // TODO: This is a side effect, consider moving it somewhere else.
                if (isDOMElement(cellElement)) {
                    cellElement.classList.add('kale-merged-cell');
                }
            }
            else {
                if (isDOMElement(cellElement)) {
                    cellElement.classList.remove('kale-merged-cell');
                }
            }
            if (newIsMergedCell === state.isMergedCell) {
                return null;
            }
            return { isMergedCell: newIsMergedCell };
        };
        // We use this element referene in order to move it inside Notebooks's cell
        // element.
        this.wrapperRef = react__WEBPACK_IMPORTED_MODULE_0__.createRef();
        this.openEditor = this.openEditor.bind(this);
    }
    componentDidMount() {
        this.setState(this.updateIsMergedState);
        this.checkIfReservedName();
        this.updateStyles();
        this.updateDependencies();
        this.attemptToMoveComponent();
    }
    attemptToMoveComponent() {
        if (!isDOMElement(this.props.cellElement)) {
            console.warn(`InlineMetadata: cellElement is not a valid DOM element (attempt ${this.retryCount + 1}/${this.maxRetries})`);
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
                const delay = 100 * Math.pow(2, this.retryCount - 1);
                setTimeout(() => {
                    this.attemptToMoveComponent();
                }, delay);
            }
            else {
                console.error('InlineMetadata: Failed to find valid cellElement after maximum retries');
            }
            return;
        }
        this.moveComponentElementInCell();
    }
    moveComponentElementInCell() {
        console.info('props value');
        console.info(this.props);
        if (!this.props.cellElement) {
            console.warn('InlineMetadata: cellElement is undefined, cannot move component');
            return;
        }
        if (!this.wrapperRef.current) {
            console.warn('InlineMetadata: wrapperRef.current is null, cannot move component');
            return;
        }
        try {
            if (!this.wrapperRef.current.classList.contains('moved')) {
                this.wrapperRef.current.classList.add('moved');
                this.props.cellElement.insertAdjacentElement('afterbegin', this.wrapperRef.current);
                console.log('InlineMetadata: Succesfully moved component to cell');
            }
        }
        catch (error) {
            console.error('InlineMetadata: Error moving component element:', error);
        }
    }
    componentWillUnmount() {
        var _a;
        const cellElement = this.props.cellElement;
        if (isDOMElement(cellElement)) {
            cellElement.classList.remove('kale-merged-cell');
            const codeMirrorElem = cellElement.querySelector('.CodeMirror');
            if (codeMirrorElem) {
                codeMirrorElem.style.border = '';
            }
        }
        if ((_a = this.wrapperRef) === null || _a === void 0 ? void 0 : _a.current) {
            this.wrapperRef.current.remove();
        }
    }
    componentDidUpdate(prevProps, prevState) {
        const mergedState = this.updateIsMergedState(this.state, this.props);
        if (mergedState) {
            this.setState(mergedState);
        }
        if (prevProps.blockName !== this.props.blockName ||
            prevProps.previousBlockName !== this.props.previousBlockName) {
            this.updateStyles();
        }
        if (prevProps.stepDependencies !== this.props.stepDependencies) {
            this.updateDependencies();
        }
        if (prevProps.cellElement !== this.props.cellElement) {
            this.retryCount = 0; // Reset retry count for new cellElement
            this.attemptToMoveComponent();
        }
        this.checkIfReservedName();
        const editorState = this.updateEditorState(this.state, this.props);
        if (editorState) {
            this.setState(editorState);
        }
    }
    /**
     * Check if the block tag of che current cell has a reserved name. If so,
     * apply the corresponding css class to the HTML Cell element.
     */
    checkIfReservedName() {
        this.setState((state, props) => {
            let cellTypeClass = '';
            if (_CellMetadataEditor__WEBPACK_IMPORTED_MODULE_3__.RESERVED_CELL_NAMES.includes(props.blockName)) {
                cellTypeClass = 'kale-reserved-cell';
            }
            if (cellTypeClass === state.cellTypeClass) {
                return null;
            }
            return { cellTypeClass };
        });
    }
    /**
     * Update the style of the active cell, by changing the left border with
     * the correct color, based on the current block name.
     */
    updateStyles() {
        if (!isDOMElement(this.props.cellElement)) {
            return;
        }
        const name = this.props.blockName || this.props.previousBlockName;
        const codeMirrorElem = this.props.cellElement.querySelector('.CodeMirror');
        if (codeMirrorElem) {
            codeMirrorElem.style.borderLeft = `2px solid transparent`;
        }
        if (!name) {
            this.setState({ color: '' });
            return;
        }
        const rgb = this.getColorFromName(name);
        this.setState({ color: rgb });
        if (codeMirrorElem) {
            codeMirrorElem.style.borderLeft = `2px solid #${rgb}`;
        }
    }
    getColorFromName(name) {
        return _lib_ColorUtils__WEBPACK_IMPORTED_MODULE_2__["default"].getColor(name);
    }
    createLimitsText() {
        const gpuType = Object.keys(this.props.limits).includes('nvidia.com/gpu')
            ? 'nvidia.com/gpu'
            : Object.keys(this.props.limits).includes('amd.com/gpu')
                ? 'amd.com/gpu'
                : undefined;
        return gpuType !== undefined ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("p", { style: { fontStyle: 'italic', marginLeft: '10px' } },
                "GPU request: ",
                gpuType + ' - ',
                this.props.limits[gpuType]))) : ('');
    }
    /**
     * Create a list of div dots that represent the dependencies of the current
     * block
     */
    updateDependencies() {
        const dependencies = this.props.stepDependencies.map((name, i) => {
            const rgb = this.getColorFromName(name);
            return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Tooltip, { placement: "top", key: i, title: name },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "kale-inline-cell-dependency", style: {
                        backgroundColor: `#${rgb}`,
                    } })));
        });
        this.setState({ dependencies });
    }
    openEditor() {
        console.log('=== openEditor DEBUG START ===');
        console.log('1. openEditor called');
        console.log('2. this:', this);
        console.log('3. this.context:', this.context);
        console.log('4. Current state:', this.state);
        try {
            const showEditor = true;
            console.log('5. About to setState with showEditor:', showEditor);
            this.setState({ showEditor }, () => {
                console.log('6. setState callback - new state:', this.state);
            });
            if (this.context) {
                console.log('7. Context exists, checking onEditorVisibilityChange');
                if (this.context.onEditorVisibilityChange) {
                    console.log('8. Calling context.onEditorVisibilityChange');
                    this.context.onEditorVisibilityChange(showEditor);
                }
                else {
                    console.error('9. onEditorVisibilityChange method missing from context');
                }
            }
            else {
                console.error('10. Context is null/undefined');
            }
            console.log('11. openEditor completed successfully');
        }
        catch (error) {
            console.error('12. Error in openEditor:', error);
        }
        console.log('=== openEditor DEBUG END ===');
    }
    render() {
        const details = _CellMetadataEditor__WEBPACK_IMPORTED_MODULE_3__.RESERVED_CELL_NAMES.includes(this.props.blockName) ? null : (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            this.state.dependencies.length > 0 ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement("p", { style: { fontStyle: 'italic', margin: '0 5px' } }, "depends on: ")) : null,
            this.state.dependencies,
            this.createLimitsText()));
        return (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { ref: this.wrapperRef },
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: 'kale-inline-cell-metadata' +
                        (this.state.isMergedCell ? ' hidden' : '') },
                    _CellMetadataEditor__WEBPACK_IMPORTED_MODULE_3__.RESERVED_CELL_NAMES.includes(this.props.blockName) ? ('') : (react__WEBPACK_IMPORTED_MODULE_0__.createElement("p", { style: { fontStyle: 'italic', marginRight: '5px' } }, "step: ")),
                    react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Tooltip, { placement: "top", key: this.props.blockName + 'tooltip', title: _CellMetadataEditor__WEBPACK_IMPORTED_MODULE_3__.RESERVED_CELL_NAMES.includes(this.props.blockName)
                            ? _CellMetadataEditor__WEBPACK_IMPORTED_MODULE_3__.RESERVED_CELL_NAMES_HELP_TEXT[this.props.blockName]
                            : 'This cell starts the pipeline step: ' +
                                this.props.blockName },
                        react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.Chip, { className: `kale-chip ${this.state.cellTypeClass}`, style: { backgroundColor: `#${this.state.color}` }, key: this.props.blockName, label: this.props.blockName })),
                    details),
                react__WEBPACK_IMPORTED_MODULE_0__.createElement("button", { onClick: (e) => {
                        console.log('=== BUTTON CLICK DEBUG START ===');
                        console.log('Button clicked event:', e);
                        console.log('Event target:', e.target);
                        console.log('Event currentTarget:', e.currentTarget);
                        alert('Button was clicked!'); // Visual confirmation
                        this.openEditor();
                        console.log('=== BUTTON CLICK DEBUG END ===');
                    }, style: {
                        position: 'fixed',
                        top: '100px',
                        right: '10px',
                        zIndex: 9999,
                        backgroundColor: 'red',
                        color: 'white',
                        padding: '10px',
                        border: 'none',
                        cursor: 'pointer'
                    } }, "TEST EDIT"))));
    }
}
InlineMetadata.contextType = _lib_CellMetadataContext__WEBPACK_IMPORTED_MODULE_4__.CellMetadataContext;


/***/ }),

/***/ "./lib/widgets/deploys-progress/DeployProgress.js":
/*!********************************************************!*\
  !*** ./lib/widgets/deploys-progress/DeployProgress.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DeployProgress: () => (/* binding */ DeployProgress)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/material */ "webpack/sharing/consume/default/@mui/material/@mui/material");
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _mui_icons_material_Close__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/icons-material/Close */ "./node_modules/@mui/icons-material/esm/Close.js");
/* harmony import */ var _mui_icons_material_Launch__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @mui/icons-material/Launch */ "./node_modules/@mui/icons-material/esm/Launch.js");
/* harmony import */ var _mui_icons_material_Error__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @mui/icons-material/Error */ "./node_modules/@mui/icons-material/esm/Error.js");
/* harmony import */ var _mui_icons_material_Help__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @mui/icons-material/Help */ "./node_modules/@mui/icons-material/esm/Help.js");
/* harmony import */ var _mui_icons_material_Schedule__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @mui/icons-material/Schedule */ "./node_modules/@mui/icons-material/esm/Schedule.js");
/* harmony import */ var _mui_icons_material_SkipNext__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @mui/icons-material/SkipNext */ "./node_modules/@mui/icons-material/esm/SkipNext.js");
/* harmony import */ var _mui_icons_material_CheckCircle__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @mui/icons-material/CheckCircle */ "./node_modules/@mui/icons-material/esm/CheckCircle.js");
/* harmony import */ var _icons_statusRunning__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../icons/statusRunning */ "./lib/icons/statusRunning.js");
/* harmony import */ var _icons_statusTerminated__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../icons/statusTerminated */ "./lib/icons/statusTerminated.js");
/* harmony import */ var _DeployUtils__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./DeployUtils */ "./lib/widgets/deploys-progress/DeployUtils.js");
/*
 * Copyright 2019-2020 The Kale Authors
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












// import { KatibProgress } from './KatibProgress';
// From kubeflow/pipelines repo
var PipelineStatus;
(function (PipelineStatus) {
    PipelineStatus["ERROR"] = "Error";
    PipelineStatus["FAILED"] = "Failed";
    PipelineStatus["PENDING"] = "Pending";
    PipelineStatus["RUNNING"] = "Running";
    PipelineStatus["SKIPPED"] = "Skipped";
    PipelineStatus["SUCCEEDED"] = "Succeeded";
    PipelineStatus["TERMINATING"] = "Terminating";
    PipelineStatus["TERMINATED"] = "Terminated";
    PipelineStatus["UNKNOWN"] = "Unknown";
})(PipelineStatus || (PipelineStatus = {}));
const DeployProgress = props => {
    // const getSnapshotLink = (task: any) => {
    //   if (!task.result || !task.result.event) {
    //     return '#';
    //   }
    //   const link = `${window.location.origin}/_/rok/buckets/${task.bucket}/files/${task.result.event.object}/versions/${task.result.event.version}`;
    //   return props.namespace ? `${link}?ns=${props.namespace}` : link;
    // };
    // const getTaskLink = (task: any) => {
    //   const link = `${window.location.origin}/_/rok/buckets/${task.bucket}/tasks/${task.id}`;
    //   return props.namespace ? `${link}?ns=${props.namespace}` : link;
    // };
    const getUploadLink = (pipeline) => {
        // link: /_/pipeline/#/pipelines/details/<id>
        // id = uploadPipeline.pipeline.id
        if (!pipeline.pipeline || !pipeline.pipeline.pipelineid) {
            return '#';
        }
        const link = `${window.location.origin}/_/pipeline/#/pipelines/details/${pipeline.pipeline.pipelineid}/version/${pipeline.pipeline.versionid}`;
        return props.namespace
            ? link.replace('#', `?ns=${props.namespace}#`)
            : link;
    };
    const getRunLink = (run) => {
        // link: /_/pipeline/#/runs/details/<id>
        // id = runPipeline.id
        if (!run.id) {
            return '#';
        }
        const link = `${window.location.origin}/_/pipeline/#/runs/details/${run.id}`;
        return props.namespace
            ? link.replace('#', `?ns=${props.namespace}#`)
            : link;
    };
    const getRunText = (pipeline) => {
        switch (pipeline.status) {
            case null:
            case 'Running':
                return 'View';
            case 'Terminating':
            case 'Failed':
                return pipeline.status;
            default:
                return 'Done';
        }
    };
    const getRunComponent = (pipeline) => {
        let title = 'Unknown status';
        let IconComponent = _mui_icons_material_Help__WEBPACK_IMPORTED_MODULE_5__["default"];
        let iconColor = '#5f6368';
        switch (pipeline.status) {
            case PipelineStatus.ERROR:
                IconComponent = _mui_icons_material_Error__WEBPACK_IMPORTED_MODULE_4__["default"];
                iconColor = _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.errorText;
                // title = 'Error';
                break;
            case PipelineStatus.FAILED:
                IconComponent = _mui_icons_material_Error__WEBPACK_IMPORTED_MODULE_4__["default"];
                iconColor = _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.errorText;
                // title = 'Failed';
                break;
            case PipelineStatus.PENDING:
                IconComponent = _mui_icons_material_Schedule__WEBPACK_IMPORTED_MODULE_6__["default"];
                iconColor = _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.weak;
                // title = 'Pendig';
                break;
            case PipelineStatus.RUNNING:
                IconComponent = _icons_statusRunning__WEBPACK_IMPORTED_MODULE_9__["default"];
                iconColor = _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.blue;
                // title = 'Running';
                break;
            case PipelineStatus.TERMINATING:
                IconComponent = _icons_statusRunning__WEBPACK_IMPORTED_MODULE_9__["default"];
                iconColor = _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.blue;
                // title = 'Terminating';
                break;
            case PipelineStatus.SKIPPED:
                IconComponent = _mui_icons_material_SkipNext__WEBPACK_IMPORTED_MODULE_7__["default"];
                // title = 'Skipped';
                break;
            case PipelineStatus.SUCCEEDED:
                IconComponent = _mui_icons_material_CheckCircle__WEBPACK_IMPORTED_MODULE_8__["default"];
                iconColor = _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.success;
                // title = 'Succeeded';
                break;
            case PipelineStatus.TERMINATED:
                IconComponent = _icons_statusTerminated__WEBPACK_IMPORTED_MODULE_10__["default"];
                iconColor = _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.terminated;
                // title = 'Terminated';
                break;
            case PipelineStatus.UNKNOWN:
                break;
            default:
                console.error('pipeline status:', pipeline.status);
        }
        return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            getRunText(pipeline),
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(IconComponent, { style: { color: iconColor, height: 18, width: 18 } })));
    };
    const handleCompileClick = () => {
        if (props.docManager && props.compiledPath) {
            try {
                props.docManager.openOrReveal(props.compiledPath);
            }
            catch (error) {
                console.error('Error opening compiled path:', error);
            }
        }
    };
    // Handle close click safely
    const handleCloseClick = () => {
        if (props.onRemove) {
            props.onRemove();
        }
    };
    // const getKatibKfpExperimentLink = (experimentId: string) => {
    //   // link: /_/pipeline/#/experiments/details/<ud>
    //   if (!experimentId) {
    //     return '#';
    //   }
    //   const link = `${window.location.origin}/_/pipeline/#/experiments/details/${experimentId}`;
    //   return props.namespace
    //     ? link.replace('#', `?ns=${props.namespace}#`)
    //     : link;
    // };
    // const getSnapshotTpl = () => {
    //   if (!props.task) {
    //     return (
    //       <React.Fragment>
    //         Unknown status
    //         <UnknownIcon
    //           style={{
    //             color: DeployUtils.color.terminated,
    //             height: 18,
    //             width: 18,
    //           }}
    //         />
    //       </React.Fragment>
    //     );
    //   }
    //   if (!['success', 'error', 'canceled'].includes(props.task.status)) {
    //     const progress = props.task.progress || 0;
    //     return (
    //       <LinearProgress
    //         variant="determinate"
    //         color="primary"
    //         value={progress}
    //       />
    //     );
    //   }
    //   let getLink: (task: any) => string = () => '#';
    //   let message = props.task.message;
    //   let IconComponent: any = UnknownIcon;
    //   let iconColor = DeployUtils.color.blue;
    //   switch (props.task.status) {
    //     case 'success':
    //       getLink = getSnapshotLink;
    //       message = 'Done';
    //       IconComponent = LaunchIcon;
    //       break;
    //     case 'error':
    //       getLink = getTaskLink;
    //       IconComponent = ErrorIcon;
    //       iconColor = DeployUtils.color.errorText;
    //       break;
    //     case 'canceled':
    //       IconComponent = CancelIcon;
    //       getLink = getTaskLink;
    //       iconColor = DeployUtils.color.canceled;
    //       break;
    //   }
    //   return (
    //     <React.Fragment>
    //       <a href={getLink(props.task)} target="_blank" rel="noopener noreferrer">
    //         {message}
    //         <IconComponent style={{ color: iconColor, height: 18, width: 18 }} />
    //       </a>
    //     </React.Fragment>
    //   );
    // };
    let validationTpl;
    if (props.notebookValidation === true) {
        validationTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_CheckCircle__WEBPACK_IMPORTED_MODULE_8__["default"], { style: { color: _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.success, height: 18, width: 18 } })));
    }
    else if (props.notebookValidation === false) {
        validationTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Error__WEBPACK_IMPORTED_MODULE_4__["default"], { style: { color: _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.errorText, height: 18, width: 18 } })));
    }
    else {
        validationTpl = react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.LinearProgress, { color: "primary" });
    }
    let compileTpl;
    if (props.compiledPath && props.compiledPath !== 'error') {
        compileTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("a", { onClick: handleCompileClick, style: { cursor: 'pointer' }, role: "button", tabIndex: 0, onKeyPress: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleCompileClick();
                    }
                } },
                "Done",
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_CheckCircle__WEBPACK_IMPORTED_MODULE_8__["default"], { style: { color: _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.success, height: 18, width: 18 } }))));
    }
    else if (props.compiledPath === 'error') {
        compileTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Error__WEBPACK_IMPORTED_MODULE_4__["default"], { style: { color: _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.errorText, height: 18, width: 18 } })));
    }
    else {
        compileTpl = react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.LinearProgress, { color: "primary" });
    }
    let uploadTpl;
    if (props.pipeline) {
        uploadTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("a", { href: getUploadLink(props.pipeline), target: "_blank", rel: "noopener noreferrer" },
                "Done",
                react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Launch__WEBPACK_IMPORTED_MODULE_3__["default"], { style: { height: 18, width: 18 } }))));
    }
    else if (props.pipeline === false) {
        uploadTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Error__WEBPACK_IMPORTED_MODULE_4__["default"], { style: { color: _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.errorText, height: 18, width: 18 } })));
    }
    else {
        uploadTpl = react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.LinearProgress, { color: "primary" });
    }
    let runTpl;
    if (props.runPipeline) {
        runTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("a", { href: getRunLink(props.runPipeline), target: "_blank", rel: "noopener noreferrer" }, getRunComponent(props.runPipeline))));
    }
    else if (props.runPipeline === false) {
        runTpl = (react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null,
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Error__WEBPACK_IMPORTED_MODULE_4__["default"], { style: { color: _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].color.errorText, height: 18, width: 18 } })));
    }
    else {
        runTpl = react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_material__WEBPACK_IMPORTED_MODULE_1__.LinearProgress, { color: "primary" });
    }
    // let katibKfpExpTpl;
    // if (!props.katibKFPExperiment) {
    //   katibKfpExpTpl = <LinearProgress color="primary" />;
    // } else if (props.katibKFPExperiment.id !== 'error') {
    //   katibKfpExpTpl = (
    //     <React.Fragment>
    //       <a
    //         href={getKatibKfpExperimentLink(props.katibKFPExperiment.id)}
    //         target="_blank"
    //         rel="noopener noreferrer"
    //       >
    //         Done
    //         <LaunchIcon style={{ fontSize: '1rem' }} />
    //       </a>
    //     </React.Fragment>
    //   );
    // } else {
    //   katibKfpExpTpl = (
    //     <React.Fragment>
    //       <ErrorIcon
    //         style={{ color: DeployUtils.color.errorText, height: 18, width: 18 }}
    //       />
    //     </React.Fragment>
    //   );
    // }
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress" },
        react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { style: {
                justifyContent: 'flex-end',
                textAlign: 'right',
                paddingRight: '4px',
                height: '1rem',
            } },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Close__WEBPACK_IMPORTED_MODULE_2__["default"], { style: { fontSize: '1rem', cursor: 'pointer' }, onClick: handleCloseClick })),
        props.showValidationProgress ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-row" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-label" }, "Validating notebook..."),
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-value" },
                validationTpl,
                _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].getWarningBadge('Validation Warnings', props.validationWarnings)))) : null,
        props.showCompileProgress ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-row" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-label" }, "Compiling notebook..."),
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-value" },
                compileTpl,
                _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].getWarningBadge('Compile Warnings', props.compileWarnings)))) : null,
        props.showUploadProgress ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-row" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-label" }, "Uploading pipeline..."),
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-value" },
                uploadTpl,
                _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].getWarningBadge('Upload Warnings', props.uploadWarnings)))) : null,
        props.showRunProgress ? (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-row" },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-label" }, "Running pipeline..."),
            react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploy-progress-value" },
                runTpl,
                _DeployUtils__WEBPACK_IMPORTED_MODULE_11__["default"].getWarningBadge('Run Warnings', props.runWarnings)))) : null));
};


/***/ }),

/***/ "./lib/widgets/deploys-progress/DeployUtils.js":
/*!*****************************************************!*\
  !*** ./lib/widgets/deploys-progress/DeployUtils.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_icons_material_Warning__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mui/icons-material/Warning */ "./node_modules/@mui/icons-material/esm/Warning.js");
/* harmony import */ var _mui_icons_material_Info__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @mui/icons-material/Info */ "./node_modules/@mui/icons-material/esm/Info.js");
/* harmony import */ var _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../lib/NotebookUtils */ "./lib/lib/NotebookUtils.js");
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




class DeployUtils {
    static getInfoBadge(title, content) {
        return (content && (react__WEBPACK_IMPORTED_MODULE_0__.createElement("a", { onClick: _ => {
                _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_3__["default"].showMessage(title, content);
            } },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Info__WEBPACK_IMPORTED_MODULE_2__["default"], { style: { color: this.color.blue, height: 18, width: 18 } }))));
    }
    static getWarningBadge(title, content) {
        return (content && (react__WEBPACK_IMPORTED_MODULE_0__.createElement("a", { onClick: _ => {
                _lib_NotebookUtils__WEBPACK_IMPORTED_MODULE_3__["default"].showMessage(title, content);
            } },
            react__WEBPACK_IMPORTED_MODULE_0__.createElement(_mui_icons_material_Warning__WEBPACK_IMPORTED_MODULE_1__["default"], { style: {
                    color: this.color.alert,
                    height: 18,
                    width: 18,
                } }))));
    }
}
DeployUtils.color = {
    // From kubeflow/pipelines repo
    activeBg: '#eaf1fd',
    alert: '#f9ab00', // Google yellow 600
    background: '#fff',
    blue: '#4285f4', // Google blue 500
    disabledBg: '#ddd',
    divider: '#e0e0e0',
    errorBg: '#fbe9e7',
    errorText: '#d50000',
    foreground: '#000',
    graphBg: '#f2f2f2',
    grey: '#5f6368', // Google grey 500
    inactive: '#5f6368',
    lightGrey: '#eee', // Google grey 200
    lowContrast: '#80868b', // Google grey 600
    secondaryText: 'rgba(0, 0, 0, .88)',
    separator: '#e8e8e8',
    strong: '#202124', // Google grey 900
    success: '#34a853',
    successWeak: '#e6f4ea', // Google green 50
    terminated: '#80868b',
    theme: '#1a73e8',
    themeDarker: '#0b59dc',
    warningBg: '#f9f9e1',
    warningText: '#ee8100',
    weak: '#9aa0a6',
    // From Rok repo
    canceled: '#ff992a',
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (DeployUtils);


/***/ }),

/***/ "./lib/widgets/deploys-progress/DeploysProgress.js":
/*!*********************************************************!*\
  !*** ./lib/widgets/deploys-progress/DeploysProgress.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DeploysProgress: () => (/* binding */ DeploysProgress)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _DeployProgress__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DeployProgress */ "./lib/widgets/deploys-progress/DeployProgress.js");
/*
 * Copyright 2019-2020 The Kale Authors
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


const DeploysProgress = props => {
    const [items, setItems] = react__WEBPACK_IMPORTED_MODULE_0__.useState([]);
    const getItems = (_deploys) => {
        return Object.entries(_deploys)
            .filter((dp) => {
            // Type guard to ensure proper typing
            return dp[1] && typeof dp[1] === 'object' && !dp[1].deleted;
        })
            .map((dp) => {
            const index = dp[0];
            const dpState = dp[1];
            return (react__WEBPACK_IMPORTED_MODULE_0__.createElement(_DeployProgress__WEBPACK_IMPORTED_MODULE_1__.DeployProgress, { key: `d-${index}`, showValidationProgress: dpState.showValidationProgress, notebookValidation: dpState.notebookValidation, validationWarnings: dpState.validationWarnings, 
                // showSnapshotProgress={dpState.showSnapshotProgress}
                task: dpState.task, 
                // snapshotWarnings={dpState.snapshotWarnings}
                showCompileProgress: dpState.showCompileProgress, compiledPath: dpState.compiledPath, compileWarnings: dpState.compileWarnings, showUploadProgress: dpState.showUploadProgress, pipeline: dpState.pipeline, uploadWarnings: dpState.uploadWarnings, showRunProgress: dpState.showRunProgress, runPipeline: dpState.runPipeline, runWarnings: dpState.runWarnings, 
                // showKatibProgress={dpState.showKatibProgress}
                // katib={dpState.katib}
                // showKatibKFPExperiment={dpState.showKatibKFPExperiment}
                // katibKFPExperiment={dpState.katibKFPExperiment}
                onRemove: _onPanelRemove(Number(index)), docManager: dpState.docManager, namespace: dpState.namespace }));
        });
    };
    const _onPanelRemove = (index) => {
        return () => {
            console.log('remove', index);
            if (typeof index === 'number') {
                props.onPanelRemove(index);
            }
        };
    };
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(() => {
        setItems(getItems(props.deploys));
    }, [props.deploys]); // Only re-run the effect if props.deploys changes
    return react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: "deploys-progress" }, items);
};


/***/ }),

/***/ "./node_modules/@jupyterlab/builder/node_modules/css-loader/dist/cjs.js!./style/index.css":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyterlab/builder/node_modules/css-loader/dist/cjs.js!./style/index.css ***!
  \************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/@jupyterlab/builder/node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/@jupyterlab/builder/node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/@jupyterlab/builder/node_modules/css-loader/dist/runtime/api.js */ "./node_modules/@jupyterlab/builder/node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../node_modules/@jupyterlab/builder/node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/@jupyterlab/builder/node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(/*! data:image/svg+xml,%3Csvg id=%27Kale_Logo%27 data-name=%27Kale Logo%27 xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 48 48%27%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23753bbd%7D%3C/style%3E%3C/defs%3E%3Cpath class=%27cls-1%27 d=%27M25.37 14.35a14.94 14.94 0 0110.7-6c0-.08-.08-.16-.14-.23a5 5 0 00-1.66-1.35 3.79 3.79 0 01-.54-.35 3.29 3.29 0 01-.32-.64 4.7 4.7 0 00-1.08-1.72 5.22 5.22 0 00-2-1 4.1 4.1 0 01-.56-.22 3.5 3.5 0 01-.53-.62A4.49 4.49 0 0027.81.81 4.48 4.48 0 0025.65.3a1.42 1.42 0 00-.28 0zM22.37.34a1.29 1.29 0 00-.28 0 4.48 4.48 0 00-2.16.52 4.49 4.49 0 00-1.47 1.42 3.51 3.51 0 01-.53.62 4.1 4.1 0 01-.56.22 5.22 5.22 0 00-2 1 4.69 4.69 0 00-1.08 1.72 3.3 3.3 0 01-.32.64 3.79 3.79 0 01-.54.35 5 5 0 00-1.66 1.35 4.67 4.67 0 00-.73 1.92 3.36 3.36 0 01-.18.67 3.61 3.61 0 01-.46.46 4.83 4.83 0 00-1.3 1.64 4.6 4.6 0 00-.29 2.06 3.33 3.33 0 010 .68 3.54 3.54 0 01-.34.55 4.7 4.7 0 00-.9 1.95 4.56 4.56 0 00.25 2.08 4 4 0 01.16.63c0 .09-.11.26-.17.38a3.72 3.72 0 00-.48 1.8A3.88 3.88 0 008 24.85l.16.27c0 .1-.07.25-.1.35a3.67 3.67 0 00-.18 1.87 3.88 3.88 0 001 1.75l.2.24v.38a3.62 3.62 0 00.23 1.9 3.91 3.91 0 001.4 1.52l.26.19c0 .1.06.26.08.38a3.64 3.64 0 00.74 1.8 4 4 0 001.79 1.11l.31.12c.06.09.14.24.19.36a3.72 3.72 0 001.21 1.52 6.55 6.55 0 002.34.64 11.24 11.24 0 013.74 8.39h1zM39.58 25.12l.16-.27A3.88 3.88 0 0040.4 23a3.73 3.73 0 00-.47-1.79 3.8 3.8 0 01-.17-.38 4.06 4.06 0 01.16-.63 4.56 4.56 0 00.25-2.08 4.69 4.69 0 00-.9-1.95 3.56 3.56 0 01-.34-.55 3.34 3.34 0 010-.68 4.6 4.6 0 00-.29-2.06 4.52 4.52 0 00-1.22-1.55h-.09a12 12 0 00-11.94 11.59A14.89 14.89 0 0137.27 33a3.57 3.57 0 001.2-1.37 3.62 3.62 0 00.23-1.9v-.38l.2-.24a3.89 3.89 0 001-1.75 3.66 3.66 0 00-.18-1.87c-.07-.12-.12-.27-.14-.37zM25.37 26v21.63h1a11.19 11.19 0 013.81-8.39 6.55 6.55 0 002.34-.64 3.71 3.71 0 001.21-1.52c.06-.11.14-.27.19-.36l.31-.12a7 7 0 00.81-.34C34.26 31 30.1 26.73 25.37 26z%27/%3E%3C/svg%3E */ "data:image/svg+xml,%3Csvg id=%27Kale_Logo%27 data-name=%27Kale Logo%27 xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 48 48%27%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23753bbd%7D%3C/style%3E%3C/defs%3E%3Cpath class=%27cls-1%27 d=%27M25.37 14.35a14.94 14.94 0 0110.7-6c0-.08-.08-.16-.14-.23a5 5 0 00-1.66-1.35 3.79 3.79 0 01-.54-.35 3.29 3.29 0 01-.32-.64 4.7 4.7 0 00-1.08-1.72 5.22 5.22 0 00-2-1 4.1 4.1 0 01-.56-.22 3.5 3.5 0 01-.53-.62A4.49 4.49 0 0027.81.81 4.48 4.48 0 0025.65.3a1.42 1.42 0 00-.28 0zM22.37.34a1.29 1.29 0 00-.28 0 4.48 4.48 0 00-2.16.52 4.49 4.49 0 00-1.47 1.42 3.51 3.51 0 01-.53.62 4.1 4.1 0 01-.56.22 5.22 5.22 0 00-2 1 4.69 4.69 0 00-1.08 1.72 3.3 3.3 0 01-.32.64 3.79 3.79 0 01-.54.35 5 5 0 00-1.66 1.35 4.67 4.67 0 00-.73 1.92 3.36 3.36 0 01-.18.67 3.61 3.61 0 01-.46.46 4.83 4.83 0 00-1.3 1.64 4.6 4.6 0 00-.29 2.06 3.33 3.33 0 010 .68 3.54 3.54 0 01-.34.55 4.7 4.7 0 00-.9 1.95 4.56 4.56 0 00.25 2.08 4 4 0 01.16.63c0 .09-.11.26-.17.38a3.72 3.72 0 00-.48 1.8A3.88 3.88 0 008 24.85l.16.27c0 .1-.07.25-.1.35a3.67 3.67 0 00-.18 1.87 3.88 3.88 0 001 1.75l.2.24v.38a3.62 3.62 0 00.23 1.9 3.91 3.91 0 001.4 1.52l.26.19c0 .1.06.26.08.38a3.64 3.64 0 00.74 1.8 4 4 0 001.79 1.11l.31.12c.06.09.14.24.19.36a3.72 3.72 0 001.21 1.52 6.55 6.55 0 002.34.64 11.24 11.24 0 013.74 8.39h1zM39.58 25.12l.16-.27A3.88 3.88 0 0040.4 23a3.73 3.73 0 00-.47-1.79 3.8 3.8 0 01-.17-.38 4.06 4.06 0 01.16-.63 4.56 4.56 0 00.25-2.08 4.69 4.69 0 00-.9-1.95 3.56 3.56 0 01-.34-.55 3.34 3.34 0 010-.68 4.6 4.6 0 00-.29-2.06 4.52 4.52 0 00-1.22-1.55h-.09a12 12 0 00-11.94 11.59A14.89 14.89 0 0137.27 33a3.57 3.57 0 001.2-1.37 3.62 3.62 0 00.23-1.9v-.38l.2-.24a3.89 3.89 0 001-1.75 3.66 3.66 0 00-.18-1.87c-.07-.12-.12-.27-.14-.37zM25.37 26v21.63h1a11.19 11.19 0 013.81-8.39 6.55 6.55 0 002.34-.64 3.71 3.71 0 001.21-1.52c.06-.11.14-.27.19-.36l.31-.12a7 7 0 00.81-.34C34.26 31 30.1 26.73 25.37 26z%27/%3E%3C/svg%3E"), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_jupyterlab_builder_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/*
 * Copyright 2019-2020 The Kale Authors
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

/*-----------------------------------------------------------------------------
| Icons
|----------------------------------------------------------------------------*/

.jp-kale-logo {
  background-image: url(${___CSS_LOADER_URL_REPLACEMENT_0___});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/*-----------------------------------------------------------------------------
| Components
|----------------------------------------------------------------------------*/

.kale-component {
  padding: 5px 0px;
}

.kale-header {
  color: #477ef0;
  letter-spacing: 0.4px;
  /*margin-top: 8px;*/
  padding: 5px;
  font-size: var(--jp-ui-font-size2);
  font-weight: 800;
  /* text-transform: uppercase; */
  /*border-bottom: solid var(--jp-border-width) var(--jp-border-color2);*/
}

.kale-header.katib-dialog-header {
  padding: 5px 0;
  margin: 20px 0 10px 0;
}

.kale-header.katib-headers-tooltip {
  height: 0.7em;
  opacity: 0.75;
}

.kale-header-switch {
  flex: 0 0 auto;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  display: -webkit-box; /* OLD - iOS 6-, Safari 3.1-6 */
  display: -moz-box; /* OLD - Firefox 19- (buggy but mostly works) */
  display: -ms-flexbox; /* TWEENER - IE 10 */
  display: -webkit-flex; /* NEW - Chrome */
  display: flex;
}

.kale-footer {
  padding: 5px 0px;
  bottom: 0;
  width: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--jp-border-color2);
  margin-top: auto;
}

/*-----------------------------------------------------------------------------
| Deploy Button
|----------------------------------------------------------------------------*/

.kale-panel {
  min-width: 300px !important;
}

.kubeflow-widget {
  flex-direction: column;
  min-width: var(--jp-sidebar-min-width);
  color: var(--jp-ui-font-color1);
  background: var(--jp-layout-color1);
  font-size: var(--jp-ui-font-size1);
  overflow: auto;
  height: 100%;
  display: -webkit-box; /* OLD - iOS 6-, Safari 3.1-6 */
  display: -moz-box; /* OLD - Firefox 19- (buggy but mostly works) */
  display: -ms-flexbox; /* TWEENER - IE 10 */
  display: -webkit-flex; /* NEW - Chrome */
  display: flex;
}

.kubeflow-widget-content {
  min-width: var(--jp-sidebar-min-width);
  /* height: calc(100% - 42px); */
  overflow: auto;
  /* border-bottom: 1px solid var(--jp-border-color2); */
}

/*-----------------------------------------------------------------------------
| Deploy Button
|----------------------------------------------------------------------------*/
/*
.deploy-button {

}
*/

.deploy-button button {
  height: 30px;
  width: 95%;
  border-radius: 2px;
  font-size: 12px;
  border-width: 0;
  padding: 2px 4px;
  font-weight: 600;
  text-transform: uppercase;
}

/*-----------------------------------------------------------------------------
| Inputs
|----------------------------------------------------------------------------*/

.input-container {
  padding: 10px 12px;
  z-index: 2;
}

.input-wrapper {
  margin-top: 5px;
  overflow: overlay;
  padding: 0 9px;
  background-color: var(--jp-input-active-background);
  /*height: 30px;*/
  box-shadow: inset 0 0 0 var(--jp-border-width) var(--jp-input-border-color);
}

.input-focus {
  box-shadow: inset 0 0 0 1px var(--jp-input-active-box-shadow-color),
    inset 0 0 0 3px var(--jp-input-active-box-shadow-color);
}

.input-wrapper input,
textarea {
  background: transparent;
  width: calc(100% - 18px);
  float: left;
  border: none;
  outline: none;
  font-size: var(--jp-ui-font-size1);
  color: var(--jp-ui-font-color0);
  line-height: var(--jp-private-commandpalette-search-height);
}

.input-wrapper input::-webkit-input-placeholder,
.input-wrapper input::-moz-placeholder,
.input-wrapper input:-ms-input-placeholder {
  color: var(--jp-ui-font-color3);
  font-size: var(--jp-ui-font-size1);
}

.input-error-label {
  color: var(--jp-error-color0);
  padding: 5px 10px 0;
  font-size: var(--jp-ui-font-size0);
  line-height: normal;
}

.volume-container {
  border-top: 2px solid var(--jp-layout-color2);
}

.volume-container:last-child {
  border-bottom: 2px solid var(--jp-layout-color2);
}

/*https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Aligning_Items_in_a_Flex_Container*/
.toolbar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
  height: auto;
  box-shadow: none;
}

.minimal-toolbar-button {
  box-shadow: none;
  background: none;
  background: var(--jp-layout-color1);
  border: none;
  appearance: none;
  -moz-appearance: none;
  padding: 0px 6px;
  height: 24px;
  border-radius: var(--jp-border-radius);
  display: flex;
  cursor: pointer;
}

.minimal-toolbar-button:hover {
  background-color: var(--jp-layout-color2);
}

.volumes-select {
  width: 80%;
}

.react-select-container {
  position: relative;
  box-sizing: border-box;
  margin: 5px 0;
}

.react-select__indicator {
  padding: 0 !important;
}

.react-select__control {
  min-height: 0 !important;
}

.p-mod-hidden {
  display: none;
}

.prev-blockname-container {
  z-index: 2;
  color: var(--jp-info-color0);
  padding: 5px 22px 0;
  font-size: var(--jp-ui-font-size0);
  line-height: normal;
}

.switch-label {
  display: table-cell;
  vertical-align: middle;
  padding-right: 10px;
  font-size: var(--jp-ui-font-size2);
}

.skip-cell-info-text {
  padding: 0 10px 5px 10px;
  font-size: var(--jp-ui-font-size0);
  line-height: normal;
}

.jp-Dialog-content {
  max-width: 75% !important;
}

.add-button {
  padding: 5px;
  margin-top: 10px;
}

.delete-button button {
  padding: 5px 0px;
  margin: 0px 10px;
  min-width: 0px;
  min-height: 0px;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  color: rgb(255, 0, 25);
  background: white;
  box-shadow: none;
}

.delete-button button:hover {
  color: rgb(189, 21, 35);
}

.delete-button svg {
  transform: scale(0.8);
}

a {
  text-decoration: underline;
  color: #477ef0;
}

.pre {
  white-space: pre;
}

.hidden {
  display: none !important;
}

.deploy-progress {
  border-top: 2px solid var(--jp-border-color2);
}

.deploy-progress:last-child {
  border-bottom: 2px solid var(--jp-border-color2);
}

.deploy-progress-label {
  /* min-width: 116px; */
  white-space: pre;
}

.labels-indented p {
  padding-left: 20px;
}

.deploy-progress-value {
  width: 100%;
  display: flex;
  align-items: center;
}

.deploy-progress-value a {
  height: 16px;
  display: flex;
  margin-left: 5px;
}

.deploy-progress-value svg {
  margin-left: 0.25rem;
}

.deploy-progress-value .MuiLinearProgress-root {
  margin-left: 0.25rem;
  width: 100%;
}

.deploy-progress-row {
  margin: 0 10px;
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--jp-border-color2);
}

.deploy-progress-row:last-child {
  border-bottom: none;
  margin-bottom: 6px;
}

.kale-inline-cell-metadata {
  /* FIXME: find a way to calculate margin */
  margin-left: 73px;
  margin-top: 8px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.kale-inline-cell-dependency {
  border-radius: 50%;
  width: 10px;
  height: 10px;
  display: inline-block;
  margin-left: 4px;
}

.jp-Notebook .jp-Cell.kale-merged-cell {
  padding-top: 0;
}

.kale-metadata-editor-wrapper {
  margin-left: 73px;
  position: relative;
}

/* .kale-editor-toggle {
  border: 0;
  width: 16px;
  height: 16px;
  padding: 0;
  cursor: pointer;
  position: absolute;
  z-index: 3;
  right: 3px;
  top: 3px;
  color: var(--jp-inverse-layout-color3);
} */

.kale-editor-toggle {
  border: 1px solid var(--jp-border-color1);
  width: 20px;
  height: 20px;
  padding: 2px;
  cursor: pointer;
  position: absolute;
  z-index: 100;
  right: 3px;
  top: 3px;
  background-color: var(--jp-cell-editor-background);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.kale-editor-toggle:hover {
  background-color: var(--jp-layout-color2);
  border-color: var(--jp-border-color2);
}

.kale-editor-toggle > svg {
  width: 100%;
  height: auto;
}

.kale-editor-toggle > svg {
  background-color: var(--jp-cell-editor-background);
}

.jp-Notebook.jp-mod-editMode
  .jp-Cell.jp-mod-selected
  .kale-editor-toggle
  > svg {
  background-color: #fff;
}

.kale-cell-metadata-editor {
  margin-bottom: 4px;
  display: flex;
  border: 0px solid var(--md-grey-400);
  align-items: center;
}

.kale-cell-metadata-editor > .MuiFormControl-root {
  margin-left: 4px;
  margin-right: 4px;
}

.kale-cell-metadata-editor-helper-text {
  color: darkgoldenrod;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  padding-left: 6px;
}

.kale-metadata-editor-wrapper.opened .kale-editor-toggle {
  position: relative;
  float: right;
  top: 4px;
  right: 50%;
  margin-right: -11px;
}

.kale-metadata-editor-wrapper.opened .kale-editor-toggle > svg {
  background-color: #fff;
}

.kale-editor-toggle:hover > svg {
  background-color: var(--jp-layout-color2);
}

.kale-reserved-cell {
  border-radius: 0 !important;
}

.kale-chip.MuiChip-root {
  height: 19px;
  color: #fff;
}

.kale-chip-select.MuiChip-root {
  height: 18px;
  margin-right: 1px;
  margin-bottom: 1px;
  line-height: 18px;
}

.kale-metadata-editor-wrapper:not(.kale-is-step)
  .kale-cell-metadata-editor
  > div:first-child {
  width: 100%;
  border-right: none;
}

.MuiButtonBase-root.Mui-disabled.menu-item-tooltip {
  pointer-events: auto;
  padding: 0;
}

.MuiButtonBase-root.Mui-disabled.menu-item-tooltip .menu-item-label {
  padding: 8px 16px;
  width: 100%;
}

.menu-item-label {
  width: 100%;
}

/* this class needs to be applied to every material switch we use because
  jp lab overrides the height of every input checkbox component.
*/
.material-switch {
  color: white;
}

.material-switch input {
  height: 100%;
}

.dialog-body {
  white-space: pre;
}
`, "",{"version":3,"sources":["webpack://./style/index.css"],"names":[],"mappings":"AAAA;;;;;;;;;;;;;;EAcE;;AAEF;;8EAE8E;;AAE9E;EACE,yDAA23D;EAC33D,wBAAwB;EACxB,4BAA4B;EAC5B,2BAA2B;AAC7B;;AAEA;;8EAE8E;;AAE9E;EACE,gBAAgB;AAClB;;AAEA;EACE,cAAc;EACd,qBAAqB;EACrB,mBAAmB;EACnB,YAAY;EACZ,kCAAkC;EAClC,gBAAgB;EAChB,+BAA+B;EAC/B,uEAAuE;AACzE;;AAEA;EACE,cAAc;EACd,qBAAqB;AACvB;;AAEA;EACE,aAAa;EACb,aAAa;AACf;;AAEA;EACE,cAAc;EACd,mBAAmB;EACnB,8BAA8B;EAC9B,mBAAmB;EACnB,oBAAoB,EAAE,+BAA+B;EACrD,iBAAiB,EAAE,+CAA+C;EAClE,oBAAoB,EAAE,oBAAoB;EAC1C,qBAAqB,EAAE,iBAAiB;EACxC,aAAa;AACf;;AAEA;EACE,gBAAgB;EAChB,SAAS;EACT,WAAW;EACX,WAAW;EACX,aAAa;EACb,sBAAsB;EACtB,6CAA6C;EAC7C,gBAAgB;AAClB;;AAEA;;8EAE8E;;AAE9E;EACE,2BAA2B;AAC7B;;AAEA;EACE,sBAAsB;EACtB,sCAAsC;EACtC,+BAA+B;EAC/B,mCAAmC;EACnC,kCAAkC;EAClC,cAAc;EACd,YAAY;EACZ,oBAAoB,EAAE,+BAA+B;EACrD,iBAAiB,EAAE,+CAA+C;EAClE,oBAAoB,EAAE,oBAAoB;EAC1C,qBAAqB,EAAE,iBAAiB;EACxC,aAAa;AACf;;AAEA;EACE,sCAAsC;EACtC,+BAA+B;EAC/B,cAAc;EACd,sDAAsD;AACxD;;AAEA;;8EAE8E;AAC9E;;;;CAIC;;AAED;EACE,YAAY;EACZ,UAAU;EACV,kBAAkB;EAClB,eAAe;EACf,eAAe;EACf,gBAAgB;EAChB,gBAAgB;EAChB,yBAAyB;AAC3B;;AAEA;;8EAE8E;;AAE9E;EACE,kBAAkB;EAClB,UAAU;AACZ;;AAEA;EACE,eAAe;EACf,iBAAiB;EACjB,cAAc;EACd,mDAAmD;EACnD,gBAAgB;EAChB,2EAA2E;AAC7E;;AAEA;EACE;2DACyD;AAC3D;;AAEA;;EAEE,uBAAuB;EACvB,wBAAwB;EACxB,WAAW;EACX,YAAY;EACZ,aAAa;EACb,kCAAkC;EAClC,+BAA+B;EAC/B,2DAA2D;AAC7D;;AAEA;;;EAGE,+BAA+B;EAC/B,kCAAkC;AACpC;;AAEA;EACE,6BAA6B;EAC7B,mBAAmB;EACnB,kCAAkC;EAClC,mBAAmB;AACrB;;AAEA;EACE,6CAA6C;AAC/C;;AAEA;EACE,gDAAgD;AAClD;;AAEA,8GAA8G;AAC9G;EACE,aAAa;EACb,mBAAmB;EACnB,8BAA8B;EAC9B,mBAAmB;EACnB,mBAAmB;EACnB,YAAY;EACZ,gBAAgB;AAClB;;AAEA;EACE,gBAAgB;EAChB,gBAAgB;EAChB,mCAAmC;EACnC,YAAY;EACZ,gBAAgB;EAChB,qBAAqB;EACrB,gBAAgB;EAChB,YAAY;EACZ,sCAAsC;EACtC,aAAa;EACb,eAAe;AACjB;;AAEA;EACE,yCAAyC;AAC3C;;AAEA;EACE,UAAU;AACZ;;AAEA;EACE,kBAAkB;EAClB,sBAAsB;EACtB,aAAa;AACf;;AAEA;EACE,qBAAqB;AACvB;;AAEA;EACE,wBAAwB;AAC1B;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,UAAU;EACV,4BAA4B;EAC5B,mBAAmB;EACnB,kCAAkC;EAClC,mBAAmB;AACrB;;AAEA;EACE,mBAAmB;EACnB,sBAAsB;EACtB,mBAAmB;EACnB,kCAAkC;AACpC;;AAEA;EACE,wBAAwB;EACxB,kCAAkC;EAClC,mBAAmB;AACrB;;AAEA;EACE,yBAAyB;AAC3B;;AAEA;EACE,YAAY;EACZ,gBAAgB;AAClB;;AAEA;EACE,gBAAgB;EAChB,gBAAgB;EAChB,cAAc;EACd,eAAe;EACf,UAAU;EACV,WAAW;EACX,kBAAkB;EAClB,sBAAsB;EACtB,iBAAiB;EACjB,gBAAgB;AAClB;;AAEA;EACE,uBAAuB;AACzB;;AAEA;EACE,qBAAqB;AACvB;;AAEA;EACE,0BAA0B;EAC1B,cAAc;AAChB;;AAEA;EACE,gBAAgB;AAClB;;AAEA;EACE,wBAAwB;AAC1B;;AAEA;EACE,6CAA6C;AAC/C;;AAEA;EACE,gDAAgD;AAClD;;AAEA;EACE,sBAAsB;EACtB,gBAAgB;AAClB;;AAEA;EACE,kBAAkB;AACpB;;AAEA;EACE,WAAW;EACX,aAAa;EACb,mBAAmB;AACrB;;AAEA;EACE,YAAY;EACZ,aAAa;EACb,gBAAgB;AAClB;;AAEA;EACE,oBAAoB;AACtB;;AAEA;EACE,oBAAoB;EACpB,WAAW;AACb;;AAEA;EACE,cAAc;EACd,aAAa;EACb,mBAAmB;EACnB,eAAe;EACf,gDAAgD;AAClD;;AAEA;EACE,mBAAmB;EACnB,kBAAkB;AACpB;;AAEA;EACE,0CAA0C;EAC1C,iBAAiB;EACjB,eAAe;EACf,kBAAkB;EAClB,aAAa;EACb,mBAAmB;AACrB;;AAEA;EACE,kBAAkB;EAClB,WAAW;EACX,YAAY;EACZ,qBAAqB;EACrB,gBAAgB;AAClB;;AAEA;EACE,cAAc;AAChB;;AAEA;EACE,iBAAiB;EACjB,kBAAkB;AACpB;;AAEA;;;;;;;;;;;GAWG;;AAEH;EACE,yCAAyC;EACzC,WAAW;EACX,YAAY;EACZ,YAAY;EACZ,eAAe;EACf,kBAAkB;EAClB,YAAY;EACZ,UAAU;EACV,QAAQ;EACR,kDAAkD;EAClD,kBAAkB;EAClB,aAAa;EACb,mBAAmB;EACnB,uBAAuB;EACvB,oBAAoB;AACtB;;AAEA;EACE,yCAAyC;EACzC,qCAAqC;AACvC;;AAEA;EACE,WAAW;EACX,YAAY;AACd;;AAEA;EACE,kDAAkD;AACpD;;AAEA;;;;EAIE,sBAAsB;AACxB;;AAEA;EACE,kBAAkB;EAClB,aAAa;EACb,oCAAoC;EACpC,mBAAmB;AACrB;;AAEA;EACE,gBAAgB;EAChB,iBAAiB;AACnB;;AAEA;EACE,oBAAoB;EACpB,kBAAkB;EAClB,aAAa;EACb,mBAAmB;EACnB,iBAAiB;AACnB;;AAEA;EACE,kBAAkB;EAClB,YAAY;EACZ,QAAQ;EACR,UAAU;EACV,mBAAmB;AACrB;;AAEA;EACE,sBAAsB;AACxB;;AAEA;EACE,yCAAyC;AAC3C;;AAEA;EACE,2BAA2B;AAC7B;;AAEA;EACE,YAAY;EACZ,WAAW;AACb;;AAEA;EACE,YAAY;EACZ,iBAAiB;EACjB,kBAAkB;EAClB,iBAAiB;AACnB;;AAEA;;;EAGE,WAAW;EACX,kBAAkB;AACpB;;AAEA;EACE,oBAAoB;EACpB,UAAU;AACZ;;AAEA;EACE,iBAAiB;EACjB,WAAW;AACb;;AAEA;EACE,WAAW;AACb;;AAEA;;CAEC;AACD;EACE,YAAY;AACd;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,gBAAgB;AAClB","sourcesContent":["/*\r\n * Copyright 2019-2020 The Kale Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n *      http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n/*-----------------------------------------------------------------------------\r\n| Icons\r\n|----------------------------------------------------------------------------*/\r\n\r\n.jp-kale-logo {\r\n  background-image: url(\"data:image/svg+xml,%3Csvg id='Kale_Logo' data-name='Kale Logo' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23753bbd%7D%3C/style%3E%3C/defs%3E%3Cpath class='cls-1' d='M25.37 14.35a14.94 14.94 0 0110.7-6c0-.08-.08-.16-.14-.23a5 5 0 00-1.66-1.35 3.79 3.79 0 01-.54-.35 3.29 3.29 0 01-.32-.64 4.7 4.7 0 00-1.08-1.72 5.22 5.22 0 00-2-1 4.1 4.1 0 01-.56-.22 3.5 3.5 0 01-.53-.62A4.49 4.49 0 0027.81.81 4.48 4.48 0 0025.65.3a1.42 1.42 0 00-.28 0zM22.37.34a1.29 1.29 0 00-.28 0 4.48 4.48 0 00-2.16.52 4.49 4.49 0 00-1.47 1.42 3.51 3.51 0 01-.53.62 4.1 4.1 0 01-.56.22 5.22 5.22 0 00-2 1 4.69 4.69 0 00-1.08 1.72 3.3 3.3 0 01-.32.64 3.79 3.79 0 01-.54.35 5 5 0 00-1.66 1.35 4.67 4.67 0 00-.73 1.92 3.36 3.36 0 01-.18.67 3.61 3.61 0 01-.46.46 4.83 4.83 0 00-1.3 1.64 4.6 4.6 0 00-.29 2.06 3.33 3.33 0 010 .68 3.54 3.54 0 01-.34.55 4.7 4.7 0 00-.9 1.95 4.56 4.56 0 00.25 2.08 4 4 0 01.16.63c0 .09-.11.26-.17.38a3.72 3.72 0 00-.48 1.8A3.88 3.88 0 008 24.85l.16.27c0 .1-.07.25-.1.35a3.67 3.67 0 00-.18 1.87 3.88 3.88 0 001 1.75l.2.24v.38a3.62 3.62 0 00.23 1.9 3.91 3.91 0 001.4 1.52l.26.19c0 .1.06.26.08.38a3.64 3.64 0 00.74 1.8 4 4 0 001.79 1.11l.31.12c.06.09.14.24.19.36a3.72 3.72 0 001.21 1.52 6.55 6.55 0 002.34.64 11.24 11.24 0 013.74 8.39h1zM39.58 25.12l.16-.27A3.88 3.88 0 0040.4 23a3.73 3.73 0 00-.47-1.79 3.8 3.8 0 01-.17-.38 4.06 4.06 0 01.16-.63 4.56 4.56 0 00.25-2.08 4.69 4.69 0 00-.9-1.95 3.56 3.56 0 01-.34-.55 3.34 3.34 0 010-.68 4.6 4.6 0 00-.29-2.06 4.52 4.52 0 00-1.22-1.55h-.09a12 12 0 00-11.94 11.59A14.89 14.89 0 0137.27 33a3.57 3.57 0 001.2-1.37 3.62 3.62 0 00.23-1.9v-.38l.2-.24a3.89 3.89 0 001-1.75 3.66 3.66 0 00-.18-1.87c-.07-.12-.12-.27-.14-.37zM25.37 26v21.63h1a11.19 11.19 0 013.81-8.39 6.55 6.55 0 002.34-.64 3.71 3.71 0 001.21-1.52c.06-.11.14-.27.19-.36l.31-.12a7 7 0 00.81-.34C34.26 31 30.1 26.73 25.37 26z'/%3E%3C/svg%3E\");\r\n  background-size: contain;\r\n  background-repeat: no-repeat;\r\n  background-position: center;\r\n}\r\n\r\n/*-----------------------------------------------------------------------------\r\n| Components\r\n|----------------------------------------------------------------------------*/\r\n\r\n.kale-component {\r\n  padding: 5px 0px;\r\n}\r\n\r\n.kale-header {\r\n  color: #477ef0;\r\n  letter-spacing: 0.4px;\r\n  /*margin-top: 8px;*/\r\n  padding: 5px;\r\n  font-size: var(--jp-ui-font-size2);\r\n  font-weight: 800;\r\n  /* text-transform: uppercase; */\r\n  /*border-bottom: solid var(--jp-border-width) var(--jp-border-color2);*/\r\n}\r\n\r\n.kale-header.katib-dialog-header {\r\n  padding: 5px 0;\r\n  margin: 20px 0 10px 0;\r\n}\r\n\r\n.kale-header.katib-headers-tooltip {\r\n  height: 0.7em;\r\n  opacity: 0.75;\r\n}\r\n\r\n.kale-header-switch {\r\n  flex: 0 0 auto;\r\n  flex-direction: row;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n  display: -webkit-box; /* OLD - iOS 6-, Safari 3.1-6 */\r\n  display: -moz-box; /* OLD - Firefox 19- (buggy but mostly works) */\r\n  display: -ms-flexbox; /* TWEENER - IE 10 */\r\n  display: -webkit-flex; /* NEW - Chrome */\r\n  display: flex;\r\n}\r\n\r\n.kale-footer {\r\n  padding: 5px 0px;\r\n  bottom: 0;\r\n  width: 100%;\r\n  z-index: 10;\r\n  display: flex;\r\n  flex-direction: column;\r\n  border-top: 1px solid var(--jp-border-color2);\r\n  margin-top: auto;\r\n}\r\n\r\n/*-----------------------------------------------------------------------------\r\n| Deploy Button\r\n|----------------------------------------------------------------------------*/\r\n\r\n.kale-panel {\r\n  min-width: 300px !important;\r\n}\r\n\r\n.kubeflow-widget {\r\n  flex-direction: column;\r\n  min-width: var(--jp-sidebar-min-width);\r\n  color: var(--jp-ui-font-color1);\r\n  background: var(--jp-layout-color1);\r\n  font-size: var(--jp-ui-font-size1);\r\n  overflow: auto;\r\n  height: 100%;\r\n  display: -webkit-box; /* OLD - iOS 6-, Safari 3.1-6 */\r\n  display: -moz-box; /* OLD - Firefox 19- (buggy but mostly works) */\r\n  display: -ms-flexbox; /* TWEENER - IE 10 */\r\n  display: -webkit-flex; /* NEW - Chrome */\r\n  display: flex;\r\n}\r\n\r\n.kubeflow-widget-content {\r\n  min-width: var(--jp-sidebar-min-width);\r\n  /* height: calc(100% - 42px); */\r\n  overflow: auto;\r\n  /* border-bottom: 1px solid var(--jp-border-color2); */\r\n}\r\n\r\n/*-----------------------------------------------------------------------------\r\n| Deploy Button\r\n|----------------------------------------------------------------------------*/\r\n/*\r\n.deploy-button {\r\n\r\n}\r\n*/\r\n\r\n.deploy-button button {\r\n  height: 30px;\r\n  width: 95%;\r\n  border-radius: 2px;\r\n  font-size: 12px;\r\n  border-width: 0;\r\n  padding: 2px 4px;\r\n  font-weight: 600;\r\n  text-transform: uppercase;\r\n}\r\n\r\n/*-----------------------------------------------------------------------------\r\n| Inputs\r\n|----------------------------------------------------------------------------*/\r\n\r\n.input-container {\r\n  padding: 10px 12px;\r\n  z-index: 2;\r\n}\r\n\r\n.input-wrapper {\r\n  margin-top: 5px;\r\n  overflow: overlay;\r\n  padding: 0 9px;\r\n  background-color: var(--jp-input-active-background);\r\n  /*height: 30px;*/\r\n  box-shadow: inset 0 0 0 var(--jp-border-width) var(--jp-input-border-color);\r\n}\r\n\r\n.input-focus {\r\n  box-shadow: inset 0 0 0 1px var(--jp-input-active-box-shadow-color),\r\n    inset 0 0 0 3px var(--jp-input-active-box-shadow-color);\r\n}\r\n\r\n.input-wrapper input,\r\ntextarea {\r\n  background: transparent;\r\n  width: calc(100% - 18px);\r\n  float: left;\r\n  border: none;\r\n  outline: none;\r\n  font-size: var(--jp-ui-font-size1);\r\n  color: var(--jp-ui-font-color0);\r\n  line-height: var(--jp-private-commandpalette-search-height);\r\n}\r\n\r\n.input-wrapper input::-webkit-input-placeholder,\r\n.input-wrapper input::-moz-placeholder,\r\n.input-wrapper input:-ms-input-placeholder {\r\n  color: var(--jp-ui-font-color3);\r\n  font-size: var(--jp-ui-font-size1);\r\n}\r\n\r\n.input-error-label {\r\n  color: var(--jp-error-color0);\r\n  padding: 5px 10px 0;\r\n  font-size: var(--jp-ui-font-size0);\r\n  line-height: normal;\r\n}\r\n\r\n.volume-container {\r\n  border-top: 2px solid var(--jp-layout-color2);\r\n}\r\n\r\n.volume-container:last-child {\r\n  border-bottom: 2px solid var(--jp-layout-color2);\r\n}\r\n\r\n/*https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Aligning_Items_in_a_Flex_Container*/\r\n.toolbar {\r\n  display: flex;\r\n  flex-direction: row;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n  border-bottom: none;\r\n  height: auto;\r\n  box-shadow: none;\r\n}\r\n\r\n.minimal-toolbar-button {\r\n  box-shadow: none;\r\n  background: none;\r\n  background: var(--jp-layout-color1);\r\n  border: none;\r\n  appearance: none;\r\n  -moz-appearance: none;\r\n  padding: 0px 6px;\r\n  height: 24px;\r\n  border-radius: var(--jp-border-radius);\r\n  display: flex;\r\n  cursor: pointer;\r\n}\r\n\r\n.minimal-toolbar-button:hover {\r\n  background-color: var(--jp-layout-color2);\r\n}\r\n\r\n.volumes-select {\r\n  width: 80%;\r\n}\r\n\r\n.react-select-container {\r\n  position: relative;\r\n  box-sizing: border-box;\r\n  margin: 5px 0;\r\n}\r\n\r\n.react-select__indicator {\r\n  padding: 0 !important;\r\n}\r\n\r\n.react-select__control {\r\n  min-height: 0 !important;\r\n}\r\n\r\n.p-mod-hidden {\r\n  display: none;\r\n}\r\n\r\n.prev-blockname-container {\r\n  z-index: 2;\r\n  color: var(--jp-info-color0);\r\n  padding: 5px 22px 0;\r\n  font-size: var(--jp-ui-font-size0);\r\n  line-height: normal;\r\n}\r\n\r\n.switch-label {\r\n  display: table-cell;\r\n  vertical-align: middle;\r\n  padding-right: 10px;\r\n  font-size: var(--jp-ui-font-size2);\r\n}\r\n\r\n.skip-cell-info-text {\r\n  padding: 0 10px 5px 10px;\r\n  font-size: var(--jp-ui-font-size0);\r\n  line-height: normal;\r\n}\r\n\r\n.jp-Dialog-content {\r\n  max-width: 75% !important;\r\n}\r\n\r\n.add-button {\r\n  padding: 5px;\r\n  margin-top: 10px;\r\n}\r\n\r\n.delete-button button {\r\n  padding: 5px 0px;\r\n  margin: 0px 10px;\r\n  min-width: 0px;\r\n  min-height: 0px;\r\n  width: 80%;\r\n  height: 80%;\r\n  border-radius: 50%;\r\n  color: rgb(255, 0, 25);\r\n  background: white;\r\n  box-shadow: none;\r\n}\r\n\r\n.delete-button button:hover {\r\n  color: rgb(189, 21, 35);\r\n}\r\n\r\n.delete-button svg {\r\n  transform: scale(0.8);\r\n}\r\n\r\na {\r\n  text-decoration: underline;\r\n  color: #477ef0;\r\n}\r\n\r\n.pre {\r\n  white-space: pre;\r\n}\r\n\r\n.hidden {\r\n  display: none !important;\r\n}\r\n\r\n.deploy-progress {\r\n  border-top: 2px solid var(--jp-border-color2);\r\n}\r\n\r\n.deploy-progress:last-child {\r\n  border-bottom: 2px solid var(--jp-border-color2);\r\n}\r\n\r\n.deploy-progress-label {\r\n  /* min-width: 116px; */\r\n  white-space: pre;\r\n}\r\n\r\n.labels-indented p {\r\n  padding-left: 20px;\r\n}\r\n\r\n.deploy-progress-value {\r\n  width: 100%;\r\n  display: flex;\r\n  align-items: center;\r\n}\r\n\r\n.deploy-progress-value a {\r\n  height: 16px;\r\n  display: flex;\r\n  margin-left: 5px;\r\n}\r\n\r\n.deploy-progress-value svg {\r\n  margin-left: 0.25rem;\r\n}\r\n\r\n.deploy-progress-value .MuiLinearProgress-root {\r\n  margin-left: 0.25rem;\r\n  width: 100%;\r\n}\r\n\r\n.deploy-progress-row {\r\n  margin: 0 10px;\r\n  display: flex;\r\n  align-items: center;\r\n  padding: 10px 0;\r\n  border-bottom: 1px solid var(--jp-border-color2);\r\n}\r\n\r\n.deploy-progress-row:last-child {\r\n  border-bottom: none;\r\n  margin-bottom: 6px;\r\n}\r\n\r\n.kale-inline-cell-metadata {\r\n  /* FIXME: find a way to calculate margin */\r\n  margin-left: 73px;\r\n  margin-top: 8px;\r\n  margin-bottom: 4px;\r\n  display: flex;\r\n  align-items: center;\r\n}\r\n\r\n.kale-inline-cell-dependency {\r\n  border-radius: 50%;\r\n  width: 10px;\r\n  height: 10px;\r\n  display: inline-block;\r\n  margin-left: 4px;\r\n}\r\n\r\n.jp-Notebook .jp-Cell.kale-merged-cell {\r\n  padding-top: 0;\r\n}\r\n\r\n.kale-metadata-editor-wrapper {\r\n  margin-left: 73px;\r\n  position: relative;\r\n}\r\n\r\n/* .kale-editor-toggle {\r\n  border: 0;\r\n  width: 16px;\r\n  height: 16px;\r\n  padding: 0;\r\n  cursor: pointer;\r\n  position: absolute;\r\n  z-index: 3;\r\n  right: 3px;\r\n  top: 3px;\r\n  color: var(--jp-inverse-layout-color3);\r\n} */\r\n\r\n.kale-editor-toggle {\r\n  border: 1px solid var(--jp-border-color1);\r\n  width: 20px;\r\n  height: 20px;\r\n  padding: 2px;\r\n  cursor: pointer;\r\n  position: absolute;\r\n  z-index: 100;\r\n  right: 3px;\r\n  top: 3px;\r\n  background-color: var(--jp-cell-editor-background);\r\n  border-radius: 3px;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  pointer-events: auto;\r\n}\r\n\r\n.kale-editor-toggle:hover {\r\n  background-color: var(--jp-layout-color2);\r\n  border-color: var(--jp-border-color2);\r\n}\r\n\r\n.kale-editor-toggle > svg {\r\n  width: 100%;\r\n  height: auto;\r\n}\r\n\r\n.kale-editor-toggle > svg {\r\n  background-color: var(--jp-cell-editor-background);\r\n}\r\n\r\n.jp-Notebook.jp-mod-editMode\r\n  .jp-Cell.jp-mod-selected\r\n  .kale-editor-toggle\r\n  > svg {\r\n  background-color: #fff;\r\n}\r\n\r\n.kale-cell-metadata-editor {\r\n  margin-bottom: 4px;\r\n  display: flex;\r\n  border: 0px solid var(--md-grey-400);\r\n  align-items: center;\r\n}\r\n\r\n.kale-cell-metadata-editor > .MuiFormControl-root {\r\n  margin-left: 4px;\r\n  margin-right: 4px;\r\n}\r\n\r\n.kale-cell-metadata-editor-helper-text {\r\n  color: darkgoldenrod;\r\n  margin-bottom: 4px;\r\n  display: flex;\r\n  align-items: center;\r\n  padding-left: 6px;\r\n}\r\n\r\n.kale-metadata-editor-wrapper.opened .kale-editor-toggle {\r\n  position: relative;\r\n  float: right;\r\n  top: 4px;\r\n  right: 50%;\r\n  margin-right: -11px;\r\n}\r\n\r\n.kale-metadata-editor-wrapper.opened .kale-editor-toggle > svg {\r\n  background-color: #fff;\r\n}\r\n\r\n.kale-editor-toggle:hover > svg {\r\n  background-color: var(--jp-layout-color2);\r\n}\r\n\r\n.kale-reserved-cell {\r\n  border-radius: 0 !important;\r\n}\r\n\r\n.kale-chip.MuiChip-root {\r\n  height: 19px;\r\n  color: #fff;\r\n}\r\n\r\n.kale-chip-select.MuiChip-root {\r\n  height: 18px;\r\n  margin-right: 1px;\r\n  margin-bottom: 1px;\r\n  line-height: 18px;\r\n}\r\n\r\n.kale-metadata-editor-wrapper:not(.kale-is-step)\r\n  .kale-cell-metadata-editor\r\n  > div:first-child {\r\n  width: 100%;\r\n  border-right: none;\r\n}\r\n\r\n.MuiButtonBase-root.Mui-disabled.menu-item-tooltip {\r\n  pointer-events: auto;\r\n  padding: 0;\r\n}\r\n\r\n.MuiButtonBase-root.Mui-disabled.menu-item-tooltip .menu-item-label {\r\n  padding: 8px 16px;\r\n  width: 100%;\r\n}\r\n\r\n.menu-item-label {\r\n  width: 100%;\r\n}\r\n\r\n/* this class needs to be applied to every material switch we use because\r\n  jp lab overrides the height of every input checkbox component.\r\n*/\r\n.material-switch {\r\n  color: white;\r\n}\r\n\r\n.material-switch input {\r\n  height: 100%;\r\n}\r\n\r\n.dialog-body {\r\n  white-space: pre;\r\n}\r\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./style/index.css":
/*!*************************!*\
  !*** ./style/index.css ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/@jupyterlab/builder/node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_jupyterlab_builder_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/@jupyterlab/builder/node_modules/css-loader/dist/cjs.js!./index.css */ "./node_modules/@jupyterlab/builder/node_modules/css-loader/dist/cjs.js!./style/index.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_jupyterlab_builder_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_jupyterlab_builder_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_jupyterlab_builder_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_jupyterlab_builder_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_jupyterlab_builder_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "data:image/svg+xml,%3Csvg id=%27Kale_Logo%27 data-name=%27Kale Logo%27 xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 48 48%27%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23753bbd%7D%3C/style%3E%3C/defs%3E%3Cpath class=%27cls-1%27 d=%27M25.37 14.35a14.94 14.94 0 0110.7-6c0-.08-.08-.16-.14-.23a5 5 0 00-1.66-1.35 3.79 3.79 0 01-.54-.35 3.29 3.29 0 01-.32-.64 4.7 4.7 0 00-1.08-1.72 5.22 5.22 0 00-2-1 4.1 4.1 0 01-.56-.22 3.5 3.5 0 01-.53-.62A4.49 4.49 0 0027.81.81 4.48 4.48 0 0025.65.3a1.42 1.42 0 00-.28 0zM22.37.34a1.29 1.29 0 00-.28 0 4.48 4.48 0 00-2.16.52 4.49 4.49 0 00-1.47 1.42 3.51 3.51 0 01-.53.62 4.1 4.1 0 01-.56.22 5.22 5.22 0 00-2 1 4.69 4.69 0 00-1.08 1.72 3.3 3.3 0 01-.32.64 3.79 3.79 0 01-.54.35 5 5 0 00-1.66 1.35 4.67 4.67 0 00-.73 1.92 3.36 3.36 0 01-.18.67 3.61 3.61 0 01-.46.46 4.83 4.83 0 00-1.3 1.64 4.6 4.6 0 00-.29 2.06 3.33 3.33 0 010 .68 3.54 3.54 0 01-.34.55 4.7 4.7 0 00-.9 1.95 4.56 4.56 0 00.25 2.08 4 4 0 01.16.63c0 .09-.11.26-.17.38a3.72 3.72 0 00-.48 1.8A3.88 3.88 0 008 24.85l.16.27c0 .1-.07.25-.1.35a3.67 3.67 0 00-.18 1.87 3.88 3.88 0 001 1.75l.2.24v.38a3.62 3.62 0 00.23 1.9 3.91 3.91 0 001.4 1.52l.26.19c0 .1.06.26.08.38a3.64 3.64 0 00.74 1.8 4 4 0 001.79 1.11l.31.12c.06.09.14.24.19.36a3.72 3.72 0 001.21 1.52 6.55 6.55 0 002.34.64 11.24 11.24 0 013.74 8.39h1zM39.58 25.12l.16-.27A3.88 3.88 0 0040.4 23a3.73 3.73 0 00-.47-1.79 3.8 3.8 0 01-.17-.38 4.06 4.06 0 01.16-.63 4.56 4.56 0 00.25-2.08 4.69 4.69 0 00-.9-1.95 3.56 3.56 0 01-.34-.55 3.34 3.34 0 010-.68 4.6 4.6 0 00-.29-2.06 4.52 4.52 0 00-1.22-1.55h-.09a12 12 0 00-11.94 11.59A14.89 14.89 0 0137.27 33a3.57 3.57 0 001.2-1.37 3.62 3.62 0 00.23-1.9v-.38l.2-.24a3.89 3.89 0 001-1.75 3.66 3.66 0 00-.18-1.87c-.07-.12-.12-.27-.14-.37zM25.37 26v21.63h1a11.19 11.19 0 013.81-8.39 6.55 6.55 0 002.34-.64 3.71 3.71 0 001.21-1.52c.06-.11.14-.27.19-.36l.31-.12a7 7 0 00.81-.34C34.26 31 30.1 26.73 25.37 26z%27/%3E%3C/svg%3E":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** data:image/svg+xml,%3Csvg id=%27Kale_Logo%27 data-name=%27Kale Logo%27 xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 48 48%27%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23753bbd%7D%3C/style%3E%3C/defs%3E%3Cpath class=%27cls-1%27 d=%27M25.37 14.35a14.94 14.94 0 0110.7-6c0-.08-.08-.16-.14-.23a5 5 0 00-1.66-1.35 3.79 3.79 0 01-.54-.35 3.29 3.29 0 01-.32-.64 4.7 4.7 0 00-1.08-1.72 5.22 5.22 0 00-2-1 4.1 4.1 0 01-.56-.22 3.5 3.5 0 01-.53-.62A4.49 4.49 0 0027.81.81 4.48 4.48 0 0025.65.3a1.42 1.42 0 00-.28 0zM22.37.34a1.29 1.29 0 00-.28 0 4.48 4.48 0 00-2.16.52 4.49 4.49 0 00-1.47 1.42 3.51 3.51 0 01-.53.62 4.1 4.1 0 01-.56.22 5.22 5.22 0 00-2 1 4.69 4.69 0 00-1.08 1.72 3.3 3.3 0 01-.32.64 3.79 3.79 0 01-.54.35 5 5 0 00-1.66 1.35 4.67 4.67 0 00-.73 1.92 3.36 3.36 0 01-.18.67 3.61 3.61 0 01-.46.46 4.83 4.83 0 00-1.3 1.64 4.6 4.6 0 00-.29 2.06 3.33 3.33 0 010 .68 3.54 3.54 0 01-.34.55 4.7 4.7 0 00-.9 1.95 4.56 4.56 0 00.25 2.08 4 4 0 01.16.63c0 .09-.11.26-.17.38a3.72 3.72 0 00-.48 1.8A3.88 3.88 0 008 24.85l.16.27c0 .1-.07.25-.1.35a3.67 3.67 0 00-.18 1.87 3.88 3.88 0 001 1.75l.2.24v.38a3.62 3.62 0 00.23 1.9 3.91 3.91 0 001.4 1.52l.26.19c0 .1.06.26.08.38a3.64 3.64 0 00.74 1.8 4 4 0 001.79 1.11l.31.12c.06.09.14.24.19.36a3.72 3.72 0 001.21 1.52 6.55 6.55 0 002.34.64 11.24 11.24 0 013.74 8.39h1zM39.58 25.12l.16-.27A3.88 3.88 0 0040.4 23a3.73 3.73 0 00-.47-1.79 3.8 3.8 0 01-.17-.38 4.06 4.06 0 01.16-.63 4.56 4.56 0 00.25-2.08 4.69 4.69 0 00-.9-1.95 3.56 3.56 0 01-.34-.55 3.34 3.34 0 010-.68 4.6 4.6 0 00-.29-2.06 4.52 4.52 0 00-1.22-1.55h-.09a12 12 0 00-11.94 11.59A14.89 14.89 0 0137.27 33a3.57 3.57 0 001.2-1.37 3.62 3.62 0 00.23-1.9v-.38l.2-.24a3.89 3.89 0 001-1.75 3.66 3.66 0 00-.18-1.87c-.07-.12-.12-.27-.14-.37zM25.37 26v21.63h1a11.19 11.19 0 013.81-8.39 6.55 6.55 0 002.34-.64 3.71 3.71 0 001.21-1.52c.06-.11.14-.27.19-.36l.31-.12a7 7 0 00.81-.34C34.26 31 30.1 26.73 25.37 26z%27/%3E%3C/svg%3E ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = "data:image/svg+xml,%3Csvg id=%27Kale_Logo%27 data-name=%27Kale Logo%27 xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 48 48%27%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23753bbd%7D%3C/style%3E%3C/defs%3E%3Cpath class=%27cls-1%27 d=%27M25.37 14.35a14.94 14.94 0 0110.7-6c0-.08-.08-.16-.14-.23a5 5 0 00-1.66-1.35 3.79 3.79 0 01-.54-.35 3.29 3.29 0 01-.32-.64 4.7 4.7 0 00-1.08-1.72 5.22 5.22 0 00-2-1 4.1 4.1 0 01-.56-.22 3.5 3.5 0 01-.53-.62A4.49 4.49 0 0027.81.81 4.48 4.48 0 0025.65.3a1.42 1.42 0 00-.28 0zM22.37.34a1.29 1.29 0 00-.28 0 4.48 4.48 0 00-2.16.52 4.49 4.49 0 00-1.47 1.42 3.51 3.51 0 01-.53.62 4.1 4.1 0 01-.56.22 5.22 5.22 0 00-2 1 4.69 4.69 0 00-1.08 1.72 3.3 3.3 0 01-.32.64 3.79 3.79 0 01-.54.35 5 5 0 00-1.66 1.35 4.67 4.67 0 00-.73 1.92 3.36 3.36 0 01-.18.67 3.61 3.61 0 01-.46.46 4.83 4.83 0 00-1.3 1.64 4.6 4.6 0 00-.29 2.06 3.33 3.33 0 010 .68 3.54 3.54 0 01-.34.55 4.7 4.7 0 00-.9 1.95 4.56 4.56 0 00.25 2.08 4 4 0 01.16.63c0 .09-.11.26-.17.38a3.72 3.72 0 00-.48 1.8A3.88 3.88 0 008 24.85l.16.27c0 .1-.07.25-.1.35a3.67 3.67 0 00-.18 1.87 3.88 3.88 0 001 1.75l.2.24v.38a3.62 3.62 0 00.23 1.9 3.91 3.91 0 001.4 1.52l.26.19c0 .1.06.26.08.38a3.64 3.64 0 00.74 1.8 4 4 0 001.79 1.11l.31.12c.06.09.14.24.19.36a3.72 3.72 0 001.21 1.52 6.55 6.55 0 002.34.64 11.24 11.24 0 013.74 8.39h1zM39.58 25.12l.16-.27A3.88 3.88 0 0040.4 23a3.73 3.73 0 00-.47-1.79 3.8 3.8 0 01-.17-.38 4.06 4.06 0 01.16-.63 4.56 4.56 0 00.25-2.08 4.69 4.69 0 00-.9-1.95 3.56 3.56 0 01-.34-.55 3.34 3.34 0 010-.68 4.6 4.6 0 00-.29-2.06 4.52 4.52 0 00-1.22-1.55h-.09a12 12 0 00-11.94 11.59A14.89 14.89 0 0137.27 33a3.57 3.57 0 001.2-1.37 3.62 3.62 0 00.23-1.9v-.38l.2-.24a3.89 3.89 0 001-1.75 3.66 3.66 0 00-.18-1.87c-.07-.12-.12-.27-.14-.37zM25.37 26v21.63h1a11.19 11.19 0 013.81-8.39 6.55 6.55 0 002.34-.64 3.71 3.71 0 001.21-1.52c.06-.11.14-.27.19-.36l.31-.12a7 7 0 00.81-.34C34.26 31 30.1 26.73 25.37 26z%27/%3E%3C/svg%3E";

/***/ })

}]);
//# sourceMappingURL=lib_index_js.f2b3e17bc9e6018b6d0b.js.map