/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';

export default class BrowseInRokBLue extends React.Component<{
  style?: React.CSSProperties;
}> {
  public render(): JSX.Element {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={this.props.style}
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <defs>
          <path
            id="a"
            d="M15.99 8.404A8 8 0 116.005.251a6.5 6.5 0 008.321 6.49l1.664 1.663z"
          />
        </defs>
        <g fill="none" fillRule="evenodd" transform="translate(-3234 -2346)">
          <g transform="translate(3237 2352)">
            <mask id="b" fill="#fff">
              <use xlinkHref="#a" />
            </mask>
            <use fill="#4990E2" xlinkHref="#a" />
            <path
              fill="#FFF"
              fillRule="nonzero"
              d="M3 3v10h10V3H3zM2 2h12v12H2V2z"
              mask="url(#b)"
            />
            <path
              fill="#FFF"
              fillRule="nonzero"
              d="M6 10h4V6H6v4zM5 5h6v6H5V5z"
              mask="url(#b)"
            />
          </g>
          <path
            fill="#4990E2"
            fillRule="nonzero"
            d="M3249.5 2355a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 2a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"
          />
          <path
            fill="#4990E2"
            fillRule="nonzero"
            d="M0.793 2.207L4.328 5.743 5.743 4.328 2.207 0.793z"
            transform="translate(3251 2354)"
          />
        </g>
      </svg>
    );
  }
}
