# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Sphinx configuration for the Kale documentation site."""

from __future__ import annotations

import os
import sys

# Make the kale package importable for autodoc.
sys.path.insert(0, os.path.abspath("../.."))

# -- Project information -----------------------------------------------------

project = "Kale"
copyright = "2026, The Kubeflow Authors"
author = "The Kubeflow Authors"

# -- General configuration ---------------------------------------------------

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.napoleon",
    "sphinx.ext.viewcode",
    "sphinx.ext.intersphinx",
    "sphinx_autodoc_typehints",
    "sphinx_copybutton",
    "sphinx_design",
    "myst_parser",
]

templates_path = ["_templates"]
exclude_patterns: list[str] = []

source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

# -- HTML output -------------------------------------------------------------

html_theme = "furo"
html_title = "Kale"
html_logo = "_static/kale-symbol.svg"
html_favicon = "_static/kale-symbol.svg"
html_static_path = ["_static"]
html_css_files = ["custom.css"]

# Furo theme options. Mirrors the Kubeflow SDK docs site so that Kale's
# documentation keeps visual parity with the rest of the Kubeflow project.
html_theme_options = {
    "sidebar_hide_name": False,
    "navigation_with_keys": True,
    "top_of_page_buttons": ["view", "edit"],
    "source_repository": "https://github.com/kubeflow/kale",
    "source_branch": "main",
    "source_directory": "docs/source/",
    # Top navigation bar, implemented via Furo's announcement slot and
    # styled by _static/custom.css (matches sdk.kubeflow.org).
    "announcement": """
        <nav class="top-nav">
            <a href="/index.html" class="top-nav-brand">
                <svg class="top-nav-logo" width="28" height="28" viewBox="-21 32 884 884" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,0 L16,0 L16,864 L0,864 L-3,836 L-8,811 L-14,791 L-24,766 L-34,746 L-47,725 L-59,709 L-68,699 L-75,697 L-90,695 L-106,690 L-118,684 L-128,674 L-135,664 L-141,653 L-161,644 L-171,638 L-183,627 L-189,617 L-193,605 L-196,590 L-207,582 L-216,574 L-225,562 L-229,552 L-231,539 L-231,519 L-241,509 L-249,497 L-253,486 L-254,481 L-254,461 L-250,445 L-252,439 L-260,424 L-264,408 L-264,399 L-262,387 L-255,368 L-254,365 L-259,348 L-261,340 L-262,323 L-260,311 L-255,298 L-249,287 L-240,276 L-239,274 L-239,252 L-237,238 L-232,222 L-224,211 L-215,201 L-202,189 L-199,185 L-195,165 L-190,153 L-184,142 L-175,132 L-167,125 L-153,117 L-143,111 L-139,106 L-135,98 L-130,86 L-121,73 L-112,65 L-96,56 L-83,51 L-68,46 L-60,39 L-51,27 L-40,16 L-26,7 L-11,2 Z" fill="#743ABD" transform="translate(376,44)"/>
                    <path d="M0,0 L4,0 L6,9 L10,14 L21,23 L31,32 L40,45 L45,57 L47,66 L48,98 L60,116 L67,131 L70,141 L71,157 L68,174 L64,186 L65,195 L71,208 L73,216 L74,229 L70,245 L62,261 L60,265 L61,271 L65,287 L65,305 L61,318 L54,330 L45,340 L42,343 L42,368 L39,380 L32,393 L27,399 L18,406 L15,405 L7,387 L-4,366 L-20,342 L-30,329 L-42,315 L-64,293 L-75,284 L-91,272 L-107,262 L-125,252 L-145,243 L-165,236 L-187,230 L-209,226 L-207,200 L-202,175 L-196,155 L-188,135 L-175,110 L-164,94 L-156,84 L-144,70 L-135,61 L-124,52 L-113,43 L-96,32 L-78,22 L-59,14 L-41,8 L-20,3 Z" fill="#743ABD" transform="translate(656,220)"/>
                    <path d="M0,0 L11,1 L33,7 L53,15 L74,26 L86,34 L98,43 L111,54 L131,74 L142,88 L152,102 L163,121 L173,142 L181,164 L185,179 L184,183 L162,193 L160,193 L158,198 L151,210 L142,220 L134,227 L112,234 L89,238 L78,249 L64,268 L55,283 L46,299 L36,322 L27,349 L22,372 L18,404 L0,404 Z" fill="#743ABD" transform="translate(449,502)"/>
                    <path d="M0,0 L17,0 L32,3 L45,8 L58,17 L70,29 L79,42 L85,46 L104,53 L123,63 L133,71 L144,85 L156,110 L164,116 L176,123 L178,126 L160,131 L140,137 L118,146 L97,156 L80,166 L64,177 L51,187 L36,200 L18,218 L9,229 L1,239 L0,239 Z" fill="#743ABD" transform="translate(449,40)"/>
                </svg>
                <span>Kale</span>
            </a>
            <div class="top-nav-links">
                <a href="https://github.com/kubeflow/kale/tree/main/examples">Examples</a>
                <a href="https://github.com/kubeflow/kale">GitHub</a>
                <a href="https://kubeflow.slack.com">Slack</a>
                <a href="https://blog.kubeflow.org">Blog</a>
            </div>
        </nav>
    """,
}

# -- Autodoc -----------------------------------------------------------------

autodoc_default_options = {
    "members": True,
    "member-order": "bysource",
    "undoc-members": False,
    "exclude-members": "__weakref__,__init__",
    "show-inheritance": True,
}

# Generate autosummary pages automatically (matches Kubeflow SDK setup).
autosummary_generate = True
autosummary_imported_members = True

# Type hints: show types in the signature so the Kubeflow SDK-style CSS for
# ``dl.py dt.sig`` elements renders correctly.
autodoc_typehints = "signature"
typehints_use_signature = True
typehints_use_signature_return = True
typehints_fully_qualified = False
always_document_param_types = False
typehints_document_rtype = False


import typing as _typing


def typehints_formatter(annotation, config=None):  # noqa: ARG001
    """Render the builtin ``type`` (and ``type[X]``) without a cross-reference.

    Several Kale classes expose a ``type`` attribute (``Artifact.type``,
    ``VolumeConfig.type``), so a cross-reference to the builtin ``type``
    collides with them and Sphinx emits an ambiguous-target warning. Rendering
    the builtin as plain literal text avoids the lookup entirely.
    """
    if annotation is type:
        return "``type``"
    if _typing.get_origin(annotation) is type:
        args = _typing.get_args(annotation)
        inner = ", ".join(
            getattr(a, "__qualname__", None) or getattr(a, "__name__", None) or repr(a)
            for a in args
        )
        return f"``type[{inner}]``"
    return None


# -- Napoleon (Google-style docstrings) --------------------------------------

napoleon_google_docstring = True
napoleon_numpy_docstring = False
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = True
napoleon_use_admonition_for_notes = True
napoleon_use_admonition_for_references = True
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True
napoleon_type_aliases = None

# -- MyST Parser -------------------------------------------------------------

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "linkify",
    "substitution",
    "tasklist",
]
myst_heading_anchors = 3

# -- Intersphinx -------------------------------------------------------------

intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "kfp": ("https://kubeflow-pipelines.readthedocs.io/en/stable/", None),
}

# -- Copy button -------------------------------------------------------------

copybutton_prompt_text = r">>> |\.\.\. |\$ "
copybutton_prompt_is_regexp = True

# -- Suppress noisy warnings -------------------------------------------------

# Autodoc will frequently fail to import optional ML dependencies when Sphinx
# runs on Read the Docs; degrade those to warnings that don't fail the build.
nitpicky = False
suppress_warnings = ["autodoc.import_object", "config.cache"]
