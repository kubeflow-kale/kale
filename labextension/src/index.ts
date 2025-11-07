// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2019–2025 The Kale Contributors.

import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import kubeflowKalePlugin from './widget';
export default [kubeflowKalePlugin] as JupyterFrontEndPlugin<any>[];
