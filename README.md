# Tanzu Build Service Sample Apps and Deployments

This is an example of some extremely simple applications being built by the [Tanzu Build Service](https://tanzu.vmware.com/build-service) (TBS) and deployed into Kubernetes.

>NOTE: This repo currently focusses on languages other than Java:
>
>* Go
>* nodejs
>* Python

## The Value of Tanzu Build Service 

There is considerable value in the Tanzu Build Service, but the easiest to understand is that when using TBS there are **no Dockerfiles**. 

Using [buildpacks](https://buildpacks.io)/[paketo](https://paketo.io) we can create container images without having to write Dockerfiles. Paketo buildpacks are intelligent, and can analyze the source code repositories they are given and build the correct container image, including dependencies, for almost any language. Imagine that, building container images without having to write Dockerfiles!

```bash
$ (find . -name "Dockerfile" | grep ".") || echo "No dockerfiles???? whaaa???"
No dockerfiles???? whaaa???
```

## Origins 

nodejs and go apps were originally from [Paketo samples](https://github.com/paketo-buildpacks/samples).

## Build Apps With Tanzu Build Service

We assume that:

* TBS has already been [installed and configured](https://docs.pivotal.io/build-service/1-1/installing.html)
* The `kp` CLI is available and if you run `kp clusterbuildler list` or similar that there will be objects available

Set the registry location. (Of course this assume TBS is all setup, secrets added, etc.)

```bash
export REGISTRY=<your registry>
```

### Build an Image for a Go Application

Create the TBS image. Note how all we do is pass the git URL and that's it. TBS will analyze the code and build the right image, without us having to provide any hints.

```bas
[ -z "$REGISTRY" ] && echo "ERROR: Please set REGISTRY variable" || \
kp image create tbs-sample-go \
--tag $REGISTRY/tbs-sample-go \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/go \
--git-revision main
```

While that build is running we can watch or view the logs.

```bash
kp build logs tbs-sample-go
```

We can also use dry run and output to yaml to get an example the Kubernetes object definition.

```
[ -z "$REGISTRY" ] && echo "ERROR: Please set REGISTRY variable" || \
kp image create tbs-sample-go \
--tag $REGISTRY/tbs-sample-go \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/go \
--git-revision main \
--dry-run \
--output yaml
```

eg. output:

```
$ kp image create tbs-sample-go \
> --tag $REGISTRY/tbs-sample-go \
> --git https://github.com/ccollicutt/tbs-sample-apps/ \
> --sub-path sample-apps/go \
> --git-revision main \
> --dry-run \
> --output yaml
Creating Image... (dry run)
apiVersion: kpack.io/v1alpha1
kind: Image
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: '{"kind":"Image","apiVersion":"kpack.io/v1alpha1","metadata":{"name":"tbs-sample-go","namespace":"default","creationTimestamp":null},"spec":{"tag":"/tbs-sample-go","builder":{"kind":"ClusterBuilder","name":"default"},"serviceAccount":"default","source":{"git":{"url":"https://github.com/ccollicutt/tbs-sample-apps/","revision":"main"},"subPath":"sample-apps/go"},"build":{"resources":{}}},"status":{}}'
  creationTimestamp: null
  name: tbs-sample-go
  namespace: default
spec:
  build:
    resources: {}
  builder:
    kind: ClusterBuilder
    name: default
  serviceAccount: default
  source:
    git:
      revision: main
      url: https://github.com/ccollicutt/tbs-sample-apps/
    subPath: sample-apps/go
  tag: /tbs-sample-go
status: {}
```

As can be seen above, `kp` is actually creating native Kubernetes objects.

We can take a look at the CRDs:

```
$ kubectl api-resources --verbs list --namespaced -o name | grep kpack
builders.kpack.io
builds.kpack.io
images.kpack.io
sourceresolvers.kpack.io
```

### NodeJS

Create the TBS image.

```bash
[ -z "$REGISTRY" ] && echo "ERROR: Please set REGISTRY variable" || \
kp image create tbs-sample-nodejs \
--tag $REGISTRY/tbs-sample-nodejs \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/nodejs \
--git-revision main
```

Note that while we have created a completely different image, the underlying base image is the same as the Go application image, and should we need to update both of them for security or other reasons, we can easily do that.

### Python

#### Setup the Python Cluster Builder

As of March, 2021, there isn't a Python builder in TBS (but will be soon) so we use the Paketo community version.

* Add the buildpack to the clusterstore

```bash
kp clusterstore add default -b gcr.io/paketo-community/python
```

* Create a cluster builder

>NOTE: the `python.yaml` builder file is in the builder folder.

```bash
export REGISTRY=<your TBS registry>
cd builders
kp clusterbuilder create py-builder \
--tag $REGISTRY/paketo-buildpacks_python \
--order python.yaml \
--stack base \
--store default
```

Examine its status.

```
kp clusterbuilder status py-builder
```

eg. output:

```
$ kp clusterbuilder status py-builder
Status:       Ready
Image:        gcr.io/pa-ccollicutt/build-service/paketo-buildpacks_python@sha256:e5ce756420e3d152b913f4fa7fa16421249e745204d967bea8330907774d6204
Stack:        io.buildpacks.stacks.bionic
Run Image:    gcr.io/pa-ccollicutt/build-service/run@sha256:0bf521429c5fac06616ef542da735f9e34c4997cc5d5987242eb7199b04ac923

BUILDPACK ID                       VERSION    HOMEPAGE
paketo-community/pipenv            0.0.118    
paketo-community/conda             0.0.113    
paketo-community/pip               0.0.140    
paketo-community/python-runtime    0.0.170    
paketo-community/python            0.0.4      


DETECTION ORDER                    
Group #1                           
  paketo-community/python@0.0.4    
```

#### Create Image

* Create the image

>Note the use of the `--cluster-builder` option.

```bash
[ -z "$REGISTRY" ] && echo "ERROR: Please set REGISTRY variable" || \
kp image create tbs-sample-python \
--cluster-builder py-builder \
--tag $REGISTRY/tbs-sample-python \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/python \
--git-revision main
```

## Running in Kubernetes

Now that we've created the images we can finally use Kubernetes (try using Kubernetes without any images, not that easy).

You need to:

1. Have built the images above via TBS, which will have pushed them to an image registry
1. Have a Kubernetes cluster to deploy to (must be able to access `$REGISTRY`)
2. Create a namespace called `sample-apps`
2. Ensure there is a secret called `regcred` in the `sample-apps` namespace with the correct credentials to access the `$REGISTRY`

### Clone This Repository

To access the Kubernetes manifests, clone this repository.

```bash
git clone https://github.com/ccollicutt/tanzu-build-service-sample-apps
cd tanzu-build-service-sample-apps
```

### Create a Namespace

```
kubectl create namespace sample-apps
```

### Set Registry Location

If it's not currently set, create this variable to wherever TBS is pushing the built images.

```bash
export REGISTRY=<your registry>
```

### Create a Regcred Kubernetes Secret

```
export REGISTRY_USER=<your user>
export REGISTRY_PASSWORD=<your password>
export REGISTRY_EMAIL=<your email>
kubectl create secret docker-registry regcred \
--docker-server=$REGISTRY \
--docker-username=$REGISTRY_USER \
--docker-password=$REGISTRY_PASSWORD \
--docker-email=$REGISTRY_EMAIL
```


### Validate Variables and Environment

```
[ -z "$REGISTRY" ] && echo "ERROR: Please set REGISTRY variable"
kubectl get ns sample-apps > /dev/null || echo "ERROR: Please create sample-apps ns"
kubectl get secret regcreds > /dev/null || echo "ERROR: Please create a kubernetes registry access secret"
```

### Deploy Apps to Kubernetes

#### Go

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-go
pushd k8s/overlays/go
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
popd
```

#### NodeJS

Assuming the image was called `tbs-sample-nodejs`:

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-nodejs
pushd k8s/overlays/nodejs
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
popd
```

#### Python
Assuming the image was called `tbs-sample-python`:

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-python
pushd k8s/overlays/python
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
popd
```

## Access the Applications

```
export GO_LB=$(kubectl get svc sample-app -n sample-apps -o jsonpath="{.status.loadBalancer.ingress[*].hostname}")
export NODEJS_LB=$(kubectl get svc sample-app-nodejs -n sample-apps -o jsonpath="{.status.loadBalancer.ingress[*].hostname}")
export PYTHON_LB=$(kubectl get svc sample-app-python -n sample-apps -o jsonpath="{.status.loadBalancer.ingress[*].hostname}")
```

And curl them.

```
curl http://$GO_LB
curl $NODEJS_LB
curl $PYTHON_LB
```

## Clean Up

* Remove TBS images and deployments

```
k delete ns sample-apps
kp image delete tbs-sample-go
kp image delete tbs-sample-nodejs
kp image delete tbs-sample-python
```

* Delete the images from your `$REGISTRY`

* Potentially uninstall TBS...but why would you? :)

