# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-05-05

This release includes 122 commits and 119 merged pull requests from 18 contributors since v0.7.0.

### Features

- *(backend)* Update backend to support KFP V2 (#447)
- *(chore)* Support dynamic versioning for dev workflow (#491)
- *(labextension)* *(backend)*  Allow code blocks to have the same name for input and output objects  (#543)
- *(labextension)* *(backend)* Add per-step runtime image selection. (#571)
- *(chore)* Configure ruff linter and git hooks (#580)
- *(labextension)* Use notebook name as default pipeline name and handle TaskMissingError (#524)
- *(labextension)* Display default base image in cell metadata UI (#593)
- *(labextension)* *(backend)* Allow users to disable/enable cache for pipeline components or for the whole pipeline (#631)
- *(chore)* Modernize Docker setup for local Kale testing (#635)
- *(labextension)* Add native JupyterLab toolbar Compile and Run commands integrated with Kale deployment flow (#611)
- *(labextension)*  Add KFP status icon to Kale (#645)
- *(labextension)* Add Kale settings in JupyterLab with enable by default and auto-save on compile/run options (#685)
- *(backend)* Allowing users to configure pip trusted hosts (#536)
- *(backend)* Implementing GPU limit on Pipeline template (#573)
- *(labextension)* Add download button for compiled pipeline file (#601)
- *(labextension)* Improve Depends on Empty State (#603)
- *(labextension)* Better CSS on Compile and upload button (#575)
- *(labextension)* Add a better empty state for Kale LeftPanel (#596)
- *(backend)* Issue 650: upgrade to `kfp==2.16.0` (#651)
- *(labextension)* Change "This step did not produce any artifacts." message to something more convenient (#677)
- *(backend)* Update Metrics to be compatible with KFP v2 APIs (#665)
- *(backend)* Issue 501: PSS baseline - set security context (#656)
- *(labextension)* Remove auto saving and prompt users to save when Running/Compiling the notebook (#707)
- *(backend)* Improve error message when KFP server doesn't support securityContext (#696)
- *(backend)* Issue 680: configure `kale` to use different `kfp` server (#702)
- *(labextension)* Validate pipeline name length in UI (max 124 characters) (#763)

### Bug Fixes

- *(backend)* Cleanup pipeline version on first upload (#448)
- *(labextension)* Fix issue #500 - JupyterLab Dark theme hides some kale features (#517)
- *(labextension)* Bump lodash, tar, and brace-expansion (#597)
- *(labextension)* Prevent deploy panel stacking on multiple clicks (#602)
- *(examples)* Update data URLs and pinned dependencies for Python 3.12 (#657)
- *(backend)* Remove unreachable code and fix typos in serveutils.py (#668)
- *(labextension)* Guard onPanelRemove against missing deploys[index] (#666)
- *(labextension)* Persist pipeline metadata changes to notebook file (#642)
- *(backend)* Close file handle in read_json_from_file (#658)
- *(backend)* Use json format for xgboost model marshalling (#678)
- *(labextension)* Disable deploy buttons on form validation errors and show friendly error messages (#608)
- *(examples)* Fix maxTrialCount for the DogBreed example
- *(backend)* Cast pipeline parameters to their types
- *(labextension)* Fix progress bars when running pipelines (#484)
- *(labextension)* Fix opening of editor after clicking edit pencil icon above cells. (#485)
- *(labextension)* Fix error in webconsole when running pipeline (#493)
- *(labextension)* Issue 451 - fixing errors that occur when opening and closing notebooks (#496)
- *(backend)* Issue 494 - fix RPC error and allow kfp to run with Default experiment (#504)
- *(labextension)* Giving pipelines a default value so it will not fail (#514)
- *(labextension)* Issue 515: fix warning symbol logic, clean up progress messages (#516)
- *(backend)* ISSUE 511: Fixing artifacts generation (#518)
- *(backend)* Issue 526: fix hardcoded params (#527)
- *(backend)* ISSUE 511: Fixing artifacts generation (#518) (#534)
- *(backend)* Pipeline Version Link Returns "Cannot retrieve pipeline… (#582)
- *(backend)* Pipeline succeeds even with invalid/empty import (#617)
- *(labextension)* Edit button goes below the Cell when adding new cell (#615)
- *(labextension)* Kale throws exception when all cells are deleted (#614)
- *(labextension)* Fix deleting cells (#639)
- *(labextension)* Steps defined after current step should not be displayed as possible dependency (#730)
- *(labextension)* Fix log in web console and delete non existing RPC call to backend (#754)

### Documentation

- *(docs)* Fix broken link to CONTRIBUTING.md in README (#626)
- *(docs)*  Fix typo in rpc utils docstring (#659)
- *(docs)* Fix typos and outdated info in v2.0 docs (#776)
- *(docs)* Update README with project status (#459)
- *(docs)* Update readme with new build steps (#483)
- *(docs)* Issue 489: Fix the links (#520)
- *(docs)* Add v2.0 demo with voiceover (#540)
- *(docs)* Add cell types in ReadMe (#620)
- *(docs)* Issue 686: update kfp docs to version 2.16.0 (#694)
- *(docs)* New docs (#756)
- *(docs)* Updating README (#768)
- *(docs)* Refactor features list formatting in README (#771)

### Build

- *(chore)* Pin GitHub Actions to commit SHAs (#725)
- *(chore)* Use changelog file for GitHub Release notes
- *(chore)* Bump python version on gha (#505)
- *(chore)* Migrate to uv + Makefile for Development Workflow (#544)
- *(chore)* Ensure Node.js 22 is used in GitHub Actions workflows (#638)

### Miscellaneous

- *(chore)* Add GitHub issue templates for Kale (#458)
- *(chore)* Cleanup license headers (#492)
- *(chore)* Chore #541: creating OWNERS file (#542)
- *(chore)* Create E2E test that runs with KFP (#532)
- *(chore)* Standardize license headers to Kubeflow format (#568)
- *(chore)* Code cleanup from some leftover code (#590)
- *(backend)* Remove SDK and Python processor modules (#591)
- *(labextension)* Remove commented-out MUI v4 blocks (#765)
- *(backend)* Remove Rok and MLMD utils (#460)
- *(backend)* Replace string-based import parsing with AST-based detection (#592)
- *(backend)* Update jputils requirements version ranges
- *(labextension)* Merge `v2.0-frontend-dev` branch into `main` (#479)
- *(labextension)* Avoid any type in typescript code (#499)
- *(examples)* Fix all the examples (#512)
- *(examples)* Issue 471 - fix example runs (#533)
- *(chore)* Remove AUTHORS file in compliance with Kubeflow policy (#545)
- *(chore)* Rename CONTRIBUTING.md file (#583)
- *(examples)* Fix base-image in examples (#595)
- *(backend)* Issue 539 - Remove Marshaller logs from the HTML Artifacts  (#579)
- *(labextension)* Hiding multiple warnings when building the extension in dev mode (#604)
- *(backend)* Remove `default` `version_name` because it is never used (#629)
- *(labextension)* Removing Outdated UI Metadata method (#695)
- *(backend)* Issue 683 remove deprecated code (#716)
- *(labextension)* Change cancel to OK in Cache Dialog (#746)
- *(backend)* Remove stale CLI entrypoints kale_server and kale-volumes (#760)
- *(backend)* Remove deprecated `block:` cell tag (#761)
- *(chore)* Add GitHub Actions release workflow and release tooling (#673)
- *(chore)* Add DCO signoff to automated version bump PRs (#692)
- *(chore)* Upgrade e2e test (#689)
- *(chore)* Issue 636: implement UI tests (#660)

### Links

Full documentation: https://kale.kubeflow.org/en/latest/

### Contributors

@ada333, @ai-naymul, @alikhere, @Amrit27k, @CodeVishal-17, @cordeirops, @davidgs, @ederign, @elikatsis, @FAUST-BENCHOU, @hmtosi, @jesuino, @Sayan4496, @StefanoFioravanzo, @Ya-shh
