#!/usr/bin/env python3
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
#
# Sets up a lightweight KFP standalone cluster using k3d (k3s in Docker).
# Requires: docker, kubectl. k3d is installed automatically if missing.
#
# Usage: python scripts/kfp-dev-setup.py [command] [cluster-name] [kfp-version] [local-port] [pid-file]

import contextlib
import os
import shutil
import signal
import subprocess
import sys
import time
import urllib.request

# Setup arguments with defaults
args = sys.argv[1:]
command = args[0] if len(args) > 0 else "setup"
cluster_name = args[1] if len(args) > 1 and args[1] else "kale-kfp"
kfp_version = args[2] if len(args) > 2 and args[2] else "2.16.0"
local_port = int(args[3]) if len(args) > 3 and args[3] else 8080
pid_file = args[4] if len(args) > 4 and args[4] else ".kfp-dev-pf.pid"

# Colors for output
BLUE = "\033[0;34m"
GREEN = "\033[0;32m"
YELLOW = "\033[0;33m"
RED = "\033[0;31m"
NC = "\033[0m"


def info(msg):
    print(f"{BLUE}{msg}{NC}")


def ok(msg):
    print(f"{GREEN}{msg}{NC}")


def warn(msg):
    print(f"{YELLOW}{msg}{NC}")


def die(msg):
    print(f"{RED}ERROR: {msg}{NC}", file=sys.stderr)
    sys.exit(1)


def check_prereqs():
    missing = []
    if not shutil.which("docker"):
        missing.append("docker")
    if not shutil.which("kubectl"):
        missing.append("kubectl")

    if missing:
        die(f"Missing required tools: {', '.join(missing)}. Install them and re-run.")

    try:
        res = subprocess.run(["docker", "info"], capture_output=True, text=True)
        if res.returncode != 0:
            die("Docker daemon is not running. Start Docker and re-run.")
    except Exception as e:
        die(f"Failed to check Docker daemon: {e}")


def ensure_k3d():
    if shutil.which("k3d"):
        try:
            res = subprocess.run(["k3d", "--version"], capture_output=True, text=True)
            version_line = res.stdout.splitlines()[0] if res.stdout else "unknown"
            ok(f"k3d already installed ({version_line})")
        except Exception:
            ok("k3d already installed")
        return

    warn("k3d not found.")
    if sys.platform == "win32":
        die(
            "k3d is required but not installed on Windows.\n"
            "Please install it using one of the following methods:\n"
            "  - winget:     winget install k3d.k3d\n"
            "  - chocolatey: choco install k3d\n"
            "  - manually:   download from https://github.com/k3d-io/k3d/releases"
        )
    else:
        warn("Installing k3d via official install script...")
        try:
            subprocess.run(
                "curl -fsSL https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash",
                shell=True,
                check=True,
            )
            ok("k3d installed successfully")
        except Exception as e:
            die(f"Failed to install k3d: {e}. Please install it manually.")


def get_existing_clusters():
    try:
        res = subprocess.run(["k3d", "cluster", "list"], capture_output=True, text=True)
        if res.returncode == 0:
            clusters = []
            for line in res.stdout.splitlines()[1:]:
                parts = line.split()
                if parts:
                    clusters.append(parts[0])
            return clusters
    except Exception:
        pass
    return []


def fix_kubeconfig_host_docker_internal(cluster_name):
    env_kc = os.environ.get("KUBECONFIG")
    paths = env_kc.split(os.pathsep) if env_kc else [os.path.expanduser("~/.kube/config")]

    for path in paths:
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    content = f.read()

                if "host.docker.internal" in content:
                    new_content = content.replace("host.docker.internal", "127.0.0.1")
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    ok(f"Fixed host.docker.internal in kubeconfig: {path}")
            except Exception as e:
                warn(f"Failed to fix host.docker.internal in kubeconfig {path}: {e}")


def create_cluster(cluster_name):
    clusters = get_existing_clusters()
    if cluster_name in clusters:
        warn(f"Cluster '{cluster_name}' already exists — skipping creation.")
        info("Starting cluster in case it was stopped...")
        with contextlib.suppress(subprocess.CalledProcessError):
            subprocess.run(["k3d", "cluster", "start", cluster_name], check=True)
    else:
        info(f"Creating k3d cluster '{cluster_name}'...")
        info("(Traefik ingress is disabled to save memory - KFP is accessed via port-forward)")
        subprocess.run(
            [
                "k3d",
                "cluster",
                "create",
                cluster_name,
                "--agents",
                "1",
                "--k3s-arg",
                "--disable=traefik@server:0",
                "--wait",
            ],
            check=True,
        )
        ok(f"Cluster '{cluster_name}' created")

    info(f"Switching kubectl context to k3d-{cluster_name}...")
    subprocess.run(["kubectl", "config", "use-context", f"k3d-{cluster_name}"], check=True)
    fix_kubeconfig_host_docker_internal(cluster_name)
    ok(f"kubectl context set to k3d-{cluster_name}")


def apply_kfp_manifests(kfp_version):
    info("  [1/3] Applying cluster-scoped resources...")
    subprocess.run(
        [
            "kubectl",
            "apply",
            "-k",
            f"github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref={kfp_version}",
        ],
        check=True,
    )

    info("  [2/3] Waiting for CRDs to be established...")
    subprocess.run(
        [
            "kubectl",
            "wait",
            "crd/applications.app.k8s.io",
            "--for",
            "condition=established",
            "--timeout=60s",
        ],
        check=True,
    )

    info("  [3/3] Applying platform-agnostic KFP manifest...")
    subprocess.run(
        [
            "kubectl",
            "apply",
            "-k",
            f"github.com/kubeflow/pipelines/manifests/kustomize/env/platform-agnostic?ref={kfp_version}",
        ],
        check=True,
    )

    info("  Waiting for KFP pods to be Ready (up to 5 min — images are being pulled)...")
    try:
        subprocess.run(
            [
                "kubectl",
                "wait",
                "pods",
                "-l",
                "application-crd-id=kubeflow-pipelines",
                "--for",
                "condition=Ready",
                "--timeout=300s",
                "-n",
                "kubeflow",
            ],
            check=True,
        )
    except subprocess.CalledProcessError as e:
        die(f"KFP pods failed to reach Ready state: {e}")


def deploy_kfp(kfp_version):
    has_ns = False
    try:
        res_ns = subprocess.run(["kubectl", "get", "namespace", "kubeflow"], capture_output=True)
        has_ns = res_ns.returncode == 0
    except Exception:
        pass

    has_deploy = False
    if has_ns:
        try:
            res_dep = subprocess.run(
                ["kubectl", "get", "deploy", "-n", "kubeflow", "ml-pipeline"], capture_output=True
            )
            has_deploy = res_dep.returncode == 0
        except Exception:
            pass

    if has_ns and has_deploy:
        warn("KFP already deployed in namespace 'kubeflow' — skipping.")
        warn(f"To upgrade KFP to v{kfp_version}, run: make kfp-dev-upgrade")
        return

    info(f"Deploying KFP v{kfp_version} (platform-agnostic, no Argo/Docker executor)...")
    apply_kfp_manifests(kfp_version)
    ok(f"KFP v{kfp_version} deployed")


def upgrade_kfp(cluster_name, kfp_version):
    info(f"Upgrading KFP to v{kfp_version} on cluster '{cluster_name}'...")
    info(f"Switching kubectl context to k3d-{cluster_name}...")
    subprocess.run(["kubectl", "config", "use-context", f"k3d-{cluster_name}"], check=True)
    fix_kubeconfig_host_docker_internal(cluster_name)
    apply_kfp_manifests(kfp_version)
    ok(f"KFP upgraded to v{kfp_version}")


def kill_process(pid):
    if sys.platform == "win32":
        try:
            os.kill(pid, signal.SIGTERM)
        except OSError:
            subprocess.run(
                ["taskkill", "/F", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
    else:
        with contextlib.suppress(OSError):
            os.kill(pid, signal.SIGTERM)


def stop_port_forward(pid_file, local_port):
    cleaned = False
    if os.path.exists(pid_file):
        try:
            with open(pid_file) as f:
                pid = int(f.read().strip())
            kill_process(pid)
            cleaned = True
        except Exception:
            pass

        with contextlib.suppress(OSError):
            os.remove(pid_file)

    # Cleanup stale kubectl processes on the same port
    if sys.platform == "win32":
        filter_str = "Name='kubectl.exe' and CommandLine like '%port-forward%ml-pipeline-ui%'"
        subprocess.run(
            [
                "powershell",
                "-Command",
                f'Get-CimInstance Win32_Process -Filter "{filter_str}" | Remove-CimInstance',
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        subprocess.run(
            f'pkill -f "kubectl port-forward.*ml-pipeline-ui.*{local_port}"',
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    if cleaned:
        ok("Port-forward stopped")


def start_port_forward(pid_file, local_port):
    stop_port_forward(pid_file, local_port)

    info(f"Starting port-forward: localhost:{local_port} -> kubeflow/ml-pipeline-ui:80")

    args = ["kubectl", "port-forward", "-n", "kubeflow", "svc/ml-pipeline-ui", f"{local_port}:80"]
    if sys.platform == "win32":
        p = subprocess.Popen(
            args,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=0x00000008 | 0x00000200,
        )
    else:
        p = subprocess.Popen(
            args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True
        )

    with open(pid_file, "w") as f:
        f.write(str(p.pid))

    time.sleep(2)

    # Smoke test: check if UI is reachable
    try:
        url = f"http://localhost:{local_port}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                ok("Port-forward verified (HTTP 200)")
                return
    except Exception:
        pass

    warn("Port-forward started but the UI did not respond yet - it may need another minute.")
    warn("Check status with: make kfp-dev-status")


def start_cluster(cluster_name, pid_file, local_port):
    info(f"Starting k3d cluster '{cluster_name}'...")
    try:
        subprocess.run(
            ["k3d", "cluster", "start", cluster_name],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        die(f"Cluster '{cluster_name}' not found. Run 'make kfp-dev-setup' first.")

    info(f"Switching kubectl context to k3d-{cluster_name}...")
    subprocess.run(["kubectl", "config", "use-context", f"k3d-{cluster_name}"], check=True)
    fix_kubeconfig_host_docker_internal(cluster_name)

    if os.path.exists(pid_file):
        try:
            with open(pid_file) as f:
                pid = int(f.read().strip())
            kill_process(pid)
        except Exception:
            pass
        with contextlib.suppress(OSError):
            os.remove(pid_file)

    info("Waiting for KFP pods to be ready...")
    try:
        subprocess.run(
            [
                "kubectl",
                "wait",
                "pods",
                "-l",
                "application-crd-id=kubeflow-pipelines",
                "--for",
                "condition=Ready",
                "--timeout=180s",
                "-n",
                "kubeflow",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
    except subprocess.CalledProcessError:
        warn("Some pods may still be starting - check with: make kfp-dev-status")

    start_port_forward(pid_file, local_port)
    ok(f"KFP UI:  http://localhost:{local_port}")
    ok(f"Run:     make kfp-run NB=... KFP_HOST=http://localhost:{local_port}")


def stop_cluster(cluster_name, pid_file, local_port):
    stop_port_forward(pid_file, local_port)
    with contextlib.suppress(Exception):
        subprocess.run(
            ["k3d", "cluster", "stop", cluster_name],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    ok("Cluster paused. Run 'make kfp-dev-start' to resume.")


def delete_cluster(cluster_name, pid_file, local_port):
    warn(f"Deleting cluster '{cluster_name}' and all KFP data...")
    stop_port_forward(pid_file, local_port)
    with contextlib.suppress(Exception):
        subprocess.run(
            ["k3d", "cluster", "delete", cluster_name],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    ok("Cluster deleted. Run 'make kfp-dev-setup' to start fresh.")


def status_cluster(cluster_name):
    info("k3d clusters:")
    try:
        subprocess.run(["k3d", "cluster", "list"])
    except FileNotFoundError:
        warn("k3d not installed")
    except Exception as e:
        warn(f"Failed to query k3d: {e}")

    print()
    info("KFP pods (kubeflow namespace):")
    try:
        subprocess.run(["kubectl", "get", "pods", "-n", "kubeflow"])
    except FileNotFoundError:
        warn("kubectl not installed")
    except Exception:
        warn("Cluster not running or unreachable")


def main():
    if command == "upgrade":
        print()
        info("=======================================================")
        info(" Kale KFP upgrade")
        info(f" Cluster: {cluster_name}  |  KFP: v{kfp_version}")
        info("=======================================================")
        print()
        check_prereqs()
        upgrade_kfp(cluster_name, kfp_version)
        print()
        ok(f"KFP upgraded to v{kfp_version} on cluster '{cluster_name}'.")
        print()
    elif command == "start":
        start_cluster(cluster_name, pid_file, local_port)
    elif command == "stop":
        stop_cluster(cluster_name, pid_file, local_port)
    elif command == "delete":
        delete_cluster(cluster_name, pid_file, local_port)
    elif command == "status":
        status_cluster(cluster_name)
    elif command == "setup" or not command:
        print()
        info("=======================================================")
        info(" Kale KFP dev cluster setup")
        info(f" Cluster: {cluster_name}  |  KFP: v{kfp_version}")
        info("=======================================================")
        print()
        check_prereqs()
        ensure_k3d()
        create_cluster(cluster_name)
        deploy_kfp(kfp_version)
        start_port_forward(pid_file, local_port)
        print()
        ok("=======================================================")
        ok(" KFP dev cluster is ready!")
        ok("=======================================================")
        print(f"{BLUE} UI:     {NC}http://localhost:{local_port}")
        print(f"{BLUE} Compile:{NC} make kfp-compile NB=notebook.ipynb")
        print(
            f"{BLUE} Run:    {NC} make kfp-run NB=notebook.ipynb KFP_HOST=http://localhost:{local_port}"
        )
        print(f"{BLUE} Stop:   {NC} make kfp-dev-stop")
        print(f"{BLUE} Resume: {NC} make kfp-dev-start")
        print(f"{BLUE} Upgrade:{NC} make kfp-dev-upgrade")
        print(f"{BLUE} Delete: {NC} make kfp-dev-delete")
        print()
        warn(
            "Memory tip: if Docker is slow, increase Docker Desktop memory in Settings -> Resources."
        )
        warn("KFP requires ~2 GB. k3d overhead is ~512 MB on top of that.")
        print()
    else:
        die(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
