# Changelog

All notable changes to this project will be documented in this file.

## [2.2.0] - 2026-08-05

### Build

- *(deps)* Bump dompurify from 3.4.2 to 3.4.10 in /labextension/ui-tests (#832)
- *(deps)* Bump tornado from 6.5.5 to 6.5.7 (#833)
- *(deps)* Bump bleach from 6.3.0 to 6.4.0 (#834)
- *(deps)* Bump cryptography from 46.0.7 to 48.0.1 (#835)
- *(deps)* Bump jupyter-server from 2.18.0 to 2.20.0 (#841)
- *(deps)* Bump transitive JS dependencies (#844)
- *(deps)* Bump tar from 7.5.12 to 7.5.17 in /labextension/ui-tests (#845)
- *(deps)* Bump form-data from 4.0.5 to 4.0.6 in /labextension/ui-tests (#846)
- *(deps)* Bump soupsieve from 2.8.3 to 2.8.4 (#876)
- *(deps)* Bump mistune from 3.2.1 to 3.3.0 (#877)
- *(deps)* Bump ws from 8.19.0 to 8.21.0 in /labextension/ui-tests (#878)
- *(deps)* Bump systeminformation from 5.31.6 to 5.31.17 in /labextension/ui-tests (#880)
- *(deps)* Bump brace-expansion from 5.0.6 to 5.0.7 in /labextension/ui-tests (#890)
- *(deps)* Bump setuptools from 82.0.0 to 83.0.0 (#897)
- *(deps)* Bump pyasn1 from 0.6.3 to 0.6.4 (#896)
- *(deps)* Bump fast-uri from 3.1.2 to 3.1.4 in /labextension/ui-tests (#902)
- *(deps)* Bump dompurify from 3.4.10 to 3.4.12 in /labextension/ui-tests (#903)
- *(deps)* Bump js-yaml from 3.14.2 to 3.15.0 in /labextension (#895)
- *(deps)* Bump brace-expansion from 5.0.7 to 5.0.9 in /labextension/ui-tests (#910)
- *(deps)* Bump ip-address from 10.2.0 to 10.4.0 in /labextension/ui-tests (#911)
- *(deps)* Bump 7 transitive deps, regenerating locks with jlpm/uv (#918)

### Documentation

- Add project ROADMAP.md (#858)
- Add v2.1 release news and good first issues link (#859)
- Add KEP-0607 for built-in example notebooks catalog (#850)
- Add KEP-0812 Composable Kale Notebooks proposal (#847)
- Add roadmap item to hide HTML Report (#886)
- Add KEP-843 for mounting PVCs (#888)

### Features

- *(dev)* Add lightweight KFP local dev cluster via k3d (#753)
- *(frontend)* Add clear metadata button to cell metadata editor (#811)
- *(backend)* Support KALE_PYPI_PROD_URL for configurable production PyPI index (#866)
- *(backend)* Auto-promote trailing cell variable to output artifact (#874)
- Allow users to hide the HTML Report (#889)
- Consolidate per-step config buttons into a single Configure dialog (#908)

### Miscellaneous

- Add CODE_OF_CONDUCT.md in kubeflow/kale (#830)
- Add ADOPTERS.md for Kale (#860)
- Add PR title check workflow with conventional commits (#861)
- Add stale issues and PRs workflow (#862)
- *(frontend)* Remove DeploysProgress wrapper and simplify to single DeployProgress (#842)

### Other

- Removing Default Security Context (#823)

Signed-off-by: William Siqueira <william.fatecsjc@gmail.com>
- Add SECURITY.md (#849)

Define security processes including vulnerability reporting channels,
disclosure process, and prevention mechanisms per Kubeflow incubating
maturity requirements.

Signed-off-by: Eder Ignatowicz <ignatowicz@gmail.com>
Co-authored-by: Claude <noreply@anthropic.com>
- Add env vars for customization of run and upload links (#821)

* add 2 new env variables to explicitly overwrite the run and upload links

Signed-off-by: Adam Maly <amaly@redhat.com>

* edit docs

Signed-off-by: Adam Maly <amaly@redhat.com>

* fixes from review - renaming, promiseAll, using only 1 type

Signed-off-by: Adam Maly <amaly@redhat.com>

* fixes from review - add basic validation and log only on Kale start

Signed-off-by: Adam Maly <amaly@redhat.com>

---------

Signed-off-by: Adam Maly <amaly@redhat.com>
