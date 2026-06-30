# Security Policy

## Supported Versions

Kale versions are expressed as `vX.Y.Z`, where X is the major version, Y is the minor version, and Z is the patch version, following [Semantic Versioning](https://semver.org/).

The project keeps release branches for the two most recent minor releases. Security and other applicable fixes may be backported to those branches based on severity and feasibility.

Users are encouraged to stay updated with the latest releases to benefit from security patches and improvements.

## Reporting a Vulnerability

We value the work of security researchers and users who report vulnerabilities to us. All reports are thoroughly investigated by project owners.

To report a vulnerability, please use one of the following private channels:

- **GitHub Security Advisory**: <https://github.com/kubeflow/kale/security/advisories/new>
- **Kubeflow Steering Committee**: [ksc@kubeflow.org](mailto:ksc@kubeflow.org)

Please provide detailed information to help us understand and address the issue promptly.

## Disclosure Process

- **Acknowledgment**: Receipt of the report will be acknowledged within 10 business days.
- **Assessment**: Project owners investigate the reported issue to determine validity and severity.
- **Resolution**: If confirmed, a fix is developed and a release prepared.
- **Notification**: Once a fix is available, the reporter is notified and public disclosure is coordinated.
- **Public Disclosure**: Vulnerability details and the fix are published in release notes and communicated through appropriate channels.

## Prevention Mechanisms

Kale uses several security measures:

- **Code Reviews**: All changes are reviewed by maintainers for quality and security.
- **Dependency Management**: Regular updates and monitoring of dependencies via Dependabot to address known vulnerabilities.
- **Secret Scanning**: GitHub secret scanning and push protection are enabled to prevent accidental exposure of credentials.
- **Continuous Integration**: Automated testing (backend, labextension, and end-to-end) and linting integrated into the CI/CD pipeline.

## Communication Channels

For general questions, the community offers:

- [Kubeflow Slack channels](https://www.kubeflow.org/docs/about/community/#kubeflow-slack-channels)
- [Kubeflow discuss mailing list](https://www.kubeflow.org/docs/about/community/#kubeflow-mailing-list)

Please **do not report** security vulnerabilities through public channels.
