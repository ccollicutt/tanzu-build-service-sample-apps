# Go Sample App using no imports

## Origins 

Originally from [Paketo samples](https://github.com/paketo-buildpacks/samples).

## Running

### Kubernetes

You need to have built this image and pushed it to an image registry. It's meant to be used by the Tanzu Build Service.

That image registry is specified below in `IMAGE_LOCATION`.

NOTE: It also assumes there is a secret called `regcred` that will allow access to the registry.

```bash
export IMAGE_LOCATION=$REGISTRY/tbs-sample-g
cd /tmp
git clone https://github.com/ccollicutt/tbs-sample-go
cd tbs-sample-go/k8s/overlays/demo/
kustomize edit set image tbs-sample-go=$IMAGE_LOCATION
kustomize build | k apply -f-
```