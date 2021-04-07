# Tanzu Build Service Sample Apps and Deployments

This is an example of some extremely simple applications being built by the [Tanzu Build Service](https://tanzu.vmware.com/build-service) (TBS) and deployed into Kubernetes.

| :exclamation:  This repo currently focuses on languages other than Java  |
|--------------------------------------------------------------------------|

* Go
* nodejs
* Python

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

```bash
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

```bash
[ -z "$REGISTRY" ] && echo "ERROR: Please set REGISTRY variable" || \
kp image create tbs-sample-go \
--tag $REGISTRY/tbs-sample-go \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/go \
--git-revision main \
--dry-run \
--output yaml
```

We can review the Kubernetes YAML that `kp` uses by using `--dry-run --output yaml`.
<details><summary>View example output</summary>
<p>

```bash
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
</p>
</details>

We can also take a look at the CRDs:

```bash
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

| :exclamation:  The `python.yaml` builder file is in the builder folder.  |
|--------------------------------------------------------------------------|

| :exclamation:   It's possible to use a different registry for TBS builders than where the resulting application images are pushed to. Below we are using the `TBS_REGISTRY`.  |
|--------------------------------------------------------------------------|

```bash
export TBS_REGISTRY=<your TBS registry>
cd builders
kp clusterbuilder create py-builder \
--tag $TBS_REGISTRY/paketo-buildpacks_python \
--order python.yaml \
--stack base \
--store default
```

Examine its status.

```bash
kp clusterbuilder status py-builder
```

<details><summary>View example output</summary>
<p>

```bash
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
</p>
</details>

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

### Set Registry Location

If it's not currently set, create this variable to wherever TBS is pushing the built images.

```bash
export REGISTRY=<your registry>
```

### Create a Regcred Kubernetes Secret

Kubernetes needs credentials to be able to pull the TBS created images from the image registry.

```bash
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

It's easy to forget one of these. :)

```bash
[ -z "$REGISTRY" ] && echo "ERROR: Please set REGISTRY variable"
kubectl get secret regcreds > /dev/null || echo "ERROR: Please create a kubernetes registry access secret"
```

### Deploy Apps to Kubernetes

#### Go

Deploy the Go application.

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

First get the assocated loabalancers for each application.

```bash
export GO_LB=$(kubectl get svc sample-app-go -n sample-apps -o jsonpath="{.status.loadBalancer.ingress[*].hostname}")
export NODEJS_LB=$(kubectl get svc sample-app-nodejs -n sample-apps -o jsonpath="{.status.loadBalancer.ingress[*].hostname}")
export PYTHON_LB=$(kubectl get svc sample-app-python -n sample-apps -o jsonpath="{.status.loadBalancer.ingress[*].hostname}")
```

And curl them.

```bash
curl -s $GO_LB | grep title
curl -s $NODEJS_LB | grep title
curl -s $PYTHON_LB | grep title
```

<details><summary>View example output</summary>
<p>

```bash
$ curl -s $GO_LB | grep title
    <title>Golang powered By Paketo Buildpacks</title>
 fury-161  tanzu-build…  sample-apps  
$ curl -s $NODEJS_LB | grep title
    <title>NodeJS powered By Paketo Buildpacks</title>
 fury-161  tanzu-build…  sample-apps  
$ curl -s $PYTHON_LB | grep title
    <title>Python powered By Paketo Buildpacks</title>
```
</p>
</details>

## Tanzu Observability by Wavefront

The nodejs sample application has as simple counter configured, and once it's deployed into a Kubernetes cluster that has been attached to Tanzu Mission Control and had the Tanzu Observability by Wavefront integration added will be able to send metrics via the handy proxy installed.

```bash
$ k get svc
NAME                    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)             AGE
wavefront-proxy-tanzu   ClusterIP   100.68.200.247   <none>        2878/TCP,9411/TCP   8m11s
```

eg. environment variable from the config map.

```bash
$ k exec -it -n sample-apps sample-app-nodejs-5b6648dc59-c5n68 -- env | grep 
WAVEFRONT WAVEFRONT_PROXY=wavefront-proxy-tanzu.tanzu-observability-saas.svc.cluster.local
```

Once logged into the Wavefront interface, search for the source `tbs-sample-app-nodejs` and there will be a metric called `wavefront.nodejs.proxy.request.counter`

Set up a while loop to access the nodejs app to send the counter.

```bash
while true; do curl $NODEJS_LB; sleep 1; echo; done
```

## Restart All Pods

Use `kubectl rollout restart` to restart all the pods if needed, ie. pull new images.

```bash
for i in go nodejs python; do
  kubectl rollout restart deployment sample-app-$i
done
```

## Clean Up

* Remove TBS images and deployments

```bash
k delete ns sample-apps
kp image delete tbs-sample-go
kp image delete tbs-sample-nodejs
kp image delete tbs-sample-python
```

* Delete the images from your `$REGISTRY`

* Potentially uninstall TBS...but why would you? :)

