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

export const wait = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const removeIdxFromArray = (
  index: number,
  arr: Array<any>,
): Array<any> => {
  return arr.slice(0, index).concat(arr.slice(index + 1, arr.length));
};

export const updateIdxInArray = (
  element: any,
  index: number,
  arr: Array<any>,
): Array<any> => {
  return arr
    .slice(0, index)
    .concat([element])
    .concat(arr.slice(index + 1, arr.length));
};

function fetchTimeout(
  url: string,
  ms: number,
  { ...options } = {},
): Promise<Response | void> {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.then(
    r => r,
    () => clearTimeout(timeout),
  );
}

export function headURL(
  href: string,
  origin: string = window.location.origin,
  timeout: number = 1500,
): Promise<Response | void> {
  return fetchTimeout(new URL(href, origin).toString(), timeout, {
    method: 'HEAD',
  });
}
