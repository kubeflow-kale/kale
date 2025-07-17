"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const ButtonGroup_1 = __importDefault(require("@material-ui/core/ButtonGroup"));
const MoreVert_1 = __importDefault(require("@material-ui/icons/MoreVert"));
const ClickAwayListener_1 = __importDefault(require("@material-ui/core/ClickAwayListener"));
const Grow_1 = __importDefault(require("@material-ui/core/Grow"));
const Paper_1 = __importDefault(require("@material-ui/core/Paper"));
const Popper_1 = __importDefault(require("@material-ui/core/Popper"));
const MenuItem_1 = __importDefault(require("@material-ui/core/MenuItem"));
const MenuList_1 = __importDefault(require("@material-ui/core/MenuList"));
const CircularProgress_1 = __importDefault(require("@material-ui/core/CircularProgress"));
exports.SplitDeployButton = props => {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const options = [
        {
            label: 'Compile and Run' + (props.katibRun ? ' Katib Job' : ''),
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
        setOpen(prevOpen => !prevOpen);
    };
    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };
    return (React.createElement("div", { className: "deploy-button" },
        React.createElement(Grid_1.default, { container: true },
            React.createElement(Grid_1.default, { item: true, xs: 12, style: { padding: '4px 10px' } },
                React.createElement(ButtonGroup_1.default, { style: { width: '100%' }, variant: "contained", color: "primary", ref: anchorRef, "aria-label": "split button" },
                    React.createElement(Button_1.default, { color: "primary", style: { width: '100%' }, onClick: _ => props.handleClick(options[selectedIndex].value) }, props.running ? (React.createElement(CircularProgress_1.default, { thickness: 6, size: 14, color: 'secondary' })) : (options[selectedIndex].label)),
                    React.createElement(Button_1.default, { color: "primary", size: "small", "aria-owns": open ? 'menu-list-grow' : undefined, "aria-haspopup": "true", onClick: handleToggle, style: { width: 'auto' } },
                        React.createElement(MoreVert_1.default, null))),
                React.createElement(Popper_1.default, { color: "primary", style: { zIndex: 2 }, open: open, anchorEl: anchorRef.current, transition: true, disablePortal: true }, ({ TransitionProps, placement }) => (React.createElement(Grow_1.default, Object.assign({}, TransitionProps, { style: {
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                    } }),
                    React.createElement(Paper_1.default, { id: "menu-list-grow" },
                        React.createElement(ClickAwayListener_1.default, { onClickAway: handleClose },
                            React.createElement(MenuList_1.default, null, options.map((option, index) => (React.createElement(MenuItem_1.default, { key: option.value, 
                                // disabled={index === 2}
                                selected: index === selectedIndex, onClick: event => handleMenuItemClick(event, index) }, option.label)))))))))))));
};
