# Go Sample App using no imports

This is an example of some extremely simple applications being built by the [Tanzu Build Service](https://tanzu.vmware.com/build-service) and deployed into Kubernets.

## Origins 

nodejs and go apps were originally from [Paketo samples](https://github.com/paketo-buildpacks/samples).

## Build Apps With Tanzu Build Service

Set the registry location. Of course this assume TBS is all setup, secrets added, etc.

```bash
export REGISTRY=<your registry>
```

### go

Create the TBS image.

```bash
kp image create tbs-sample-apps \
--tag $REGISTRY/tbs-sample-apps \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/go \
--git-revision main
```

### nodejs

Create the TBS image.

```bash
kp image create tbs-sample-nodejs \
--tag $REGISTRY/tbs-sample-nodejs \
--git https://github.com/ccollicutt/tbs-sample-apps/ \
--sub-path sample-apps/nodejs \
--git-revision main
```

### python

### Setup Builder

As of March, 2021, there isn't a Python builder in TBS (but will be soon) so we use the Paketo community version.

* Add the buildpack to the clusterstore

```bash
kp clusterstore add default -b gcr.io/paketo-community/python
```

* Create a cluster builder

>NOTE: the `python.yaml` buildler file is in the builder folder.

```bash
export REGISTRY=<your TBS registry>
cd builders
kp builder create py-builder \
--tag $REGISTRY/paketo-buildpacks_python \
--order python.yaml \
--stack base \
--store default
```

### Create Image

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

## Running

You need to have built the images and pushed them to an image registry. It's meant to be used by the Tanzu Build Service which would do that work for you.

That image registry is specified below in `IMAGE_LOCATION`.

>NOTE: It also assumes there is a secret called `regcred` in the namespace that will allow access to the registry.


### Clone this repository

```bash
git clone https://github.com/ccollicutt/tbs-sample-apps
cd tbs-sample-apps
```

### Set Registry Location

Set this variable to wherever TBS is pushing the built images.

```bash
export REGISTRY=<your registry>
```

### go

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-go
cd k8s/overlays/go
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
```

### nodejs

Assuming the image was called `tbs-sample-nodejs`:

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-nodejs
cd k8s/overlays/nodejs
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
```


### python


Assuming the image was called `tbs-sample-python`:

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-nodejs
cd k8s/overlays/nodejs
kustomize edit set image tbs-sample-app=$IMAGE_LOCATION
kustomize build | k apply -f-
```