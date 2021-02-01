## Kubernetes native snapshots

This folder contains information about the development of generic snapshot
support for Kale using Kubernetes Volume Snapshots. The feature is not yet fully working, 
but any help with testing or development is greatly appreciated.

# Permissions needed
To be able to make use of create snapshots, get the storage classes, list snapshot proviers, etc. 
some additional permissions are needed. Please note that setting these permissions might not be secure. This will need to be validated later. First, a new ClusterRole needs to be created using the command:
```
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: snapshot-access
rules:
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshots"]
    verbs: ["create", "get", "list", "watch", "patch", "delete"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotcontents"]
    verbs: ["create", "get", "list", "watch", "update", "delete"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotcontents/status"]
    verbs: ["update"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshots/status"]
    verbs: ["update"]
  - apiGroups: ["snapshot.storage.k8s.io"]
    resources: ["volumesnapshotclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list"]
EOF
```

To allow the default-editor ServiceAccount in the namespace `admin` access to these feautres 
the following command can be used:
```
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: allow-snapshot-nb-admin
  namespace: admin
subjects:
- kind: ServiceAccount
  name: default-editor
  namespace: admin
roleRef:
  kind: ClusterRole
  name: snapshot-access
  apiGroup: rbac.authorization.k8s.io
EOF
```
