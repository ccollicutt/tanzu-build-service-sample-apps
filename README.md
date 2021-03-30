# Go Sample App using no imports

## Origins 

Originally from [Paketo samples](https://github.com/paketo-buildpacks/samples).

## Running

### Kubernetes

```bash
kubectl create -f k8s/
```

### Docker 

`docker run --interactive --tty --env PORT=8080 --publish 8080:8080 go-sample`

## Viewing

`curl http://localhost:8080`
