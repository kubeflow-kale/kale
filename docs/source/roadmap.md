# Roadmap

Kale is under active development again after a hiatus, with a re-energized
maintainer team and a growing roster of contributors. This page captures the
current direction in broad strokes — it is intentionally not a detailed spec.
Things will move around as the community gives feedback.

## Where we are

Kale **v2.0** is the headline release for this cycle. It brings the project
back in sync with the Kubeflow ecosystem:

- Full compatibility with **Kubeflow Pipelines v2** (the KFP v2 DSL and YAML
  IR, artifact model, and component spec).
- A **modernized JupyterLab 4.x extension** rewritten for the current
  labextension API.
- **Python 3.11+** support across the backend.
- A cleaner, testable compiler pipeline with golden-file fixtures for the
  generated KFP DSL.

Tracking issue: [kubeflow/kale#457 — Road to 2.0](https://github.com/kubeflow/kale/issues/457).

## What we're focused on now

### GSoC 2026: composable notebooks

Kale is participating in **Google Summer of Code 2026** under the Kubeflow
umbrella. The accepted project focuses on **multi-notebook coordination and
composable pipelines** — letting users build pipelines that span more than
one notebook, and composing them into larger workflows. This is a concrete,
community-driven effort landing in Kale over the coming months, and it
shapes a lot of the near-term priorities below.

If you want to contribute, the GSoC project is a great way to get involved.
Subscribe to the GitHub milestone for that work, drop a note in the
ML Experience WG meeting, or ping us on Slack.

## Directional themes

These are high-level directions the maintainers are aligning around. None of
them are committed features yet; they indicate _where_ we expect Kale to go,
not a fixed schedule.

### Deeper notebook experience

The notebook is where Kale differentiates, and we want to make that
experience richer:

- **Incremental execution** — compile and run only the parts of a pipeline
  that changed since the last run, without recomputing upstream steps.
- **Dependency visualization** — surface Kale's DAG view directly in the
  side panel so you can see the pipeline shape while editing.
- **Run sweeps and experiment comparison** — easy fan-out across parameter
  grids, with side-by-side metrics comparisons in the KFP UI.

### From development to production

- **Local execution mode** — run a Kale pipeline end-to-end on the local
  machine for fast feedback, without a Kubernetes cluster in the loop.
- **Kubeflow SDK integration** — tighter alignment with the emerging
  [Kubeflow SDK](https://sdk.kubeflow.org/), so that Kale-generated
  pipelines can interop with hand-written SDK pipelines and components.
- **Artifact management and model registry** — better default support for
  typed artifacts, model cards, and registries so that pipelines can hand
  off to serving and evaluation infrastructure without glue code.

### Community and ecosystem

- **Documentation** — that's what this site is about. Expect the docs to
  grow in scope as features land.
- **Contributor onboarding** — simpler setup, better `make` targets,
  clearer contribution docs, more "good first issue" labeling.
- **Ecosystem alignment** — closer collaboration with the Kubeflow ML
  Experience WG, KFP, Notebooks, and Katib maintainers.

## There's much more to come

The maintainers are happy to say: this is the most active Kale has been in
years, and we're treating the roadmap as a living document. Expect more
detail to appear on this page as concrete designs emerge from the WG.

## Get involved in shaping the roadmap

- **GitHub issues and discussions** — file issues for bugs, feature
  requests, and design discussions. Label suggestions welcome.
- **Milestones and project boards** — see the
  [milestones](https://github.com/kubeflow/kale/milestones) page for
  in-flight work.
- **ML Experience Working Group meetings** — bi-weekly on the Kubeflow
  community calendar. Kale roadmap updates are a recurring agenda item.
- **Slack** — `#kubeflow-ml-experience` on the Kubeflow Slack workspace.

The best way to influence the roadmap is to show up with a use case.
