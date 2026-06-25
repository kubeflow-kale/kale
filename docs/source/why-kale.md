# Why Kale

```{admonition} Content in progress
:class: note

This page will go into detail about why Kale exists, who it's for, and how it
compares to writing KFP components and pipelines by hand. The content is being
iterated on — expect a fuller write-up shortly.
```

In the meantime, here's the short version:

- **You already have a notebook.** Kale lets you keep it. Instead of rewriting
  it as a KFP pipeline, you tag cells with Kale's lightweight annotations and
  let Kale compile the pipeline for you.
- **Data passing is automatic.** Kale statically analyses your code to find
  which variables are shared between steps, and injects the right
  save/load calls using its type-aware marshalling system.
- **It's designed for iteration.** You can go back to a pure notebook workflow
  at any time — nothing Kale does is destructive or locks you in.
- **It fits into Kubeflow.** Kale compiles to KFP v2 DSL, so your pipelines
  run on the same infrastructure as any other Kubeflow workload.

For a concrete walk-through, head over to the
[Quickstart](getting-started/quickstart.md).
