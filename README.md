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

### Go

Create the TBS image. Note how all we do is pass the git URL and that's it. TBS will analyze the code and build the right image, without us having to provide any hints.

```bash
kp image create tbs-sample-go \
--tag $REGISTRY/tbs-sample-go \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/go \
--git-revision main
```

### NodeJS

Create the TBS image.

```bash
kp image create tbs-sample-nodejs \
--tag $REGISTRY/tbs-sample-nodejs \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/nodejs \
--git-revision main
```

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
kp builder create py-builder \
--tag $REGISTRY/paketo-buildpacks_python \
--order python.yaml \
--stack base \
--store default
```

#### Create Image

* Create the image

>Note the use of the `--cluster-builder` option.

```bash
kp image create tbs-sample-python \
--cluster-builder py-builder \
--tag $REGISTRY/tbs-sample-python \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/python \
--git-revision main
```

## Running in Kubernetes

You need to:

1. Have built the images via TBS and pushed them to an image registry
1. Have a Kubernetes cluster to deploy to (must be able to access `$REGISTRY`)
2. Create a namespace called `sample-apps`
2. Ensure there is a secret called `regcred` in the `sample-apps` namespace with the correct credentials to access the `$REGISTRY`

### Clone This Repository

```bash
git clone https://github.com/ccollicutt/tbs-sample-apps
cd tbs-sample-apps
```

### Set Registry Location

Set this variable to wherever TBS is pushing the built images.

```bash
export REGISTRY=<your registry>
```

### Deploy Apps to Kubernetes

#### Go

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-go
cd k8s/overlays/go
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
```

#### NodeJS

Assuming the image was called `tbs-sample-nodejs`:

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-nodejs
cd k8s/overlays/nodejs
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
```

#### Python
Assuming the image was called `tbs-sample-python`:

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-python
cd k8s/overlays/python
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
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

* Potentially uninstall TBS (but why would you?)

