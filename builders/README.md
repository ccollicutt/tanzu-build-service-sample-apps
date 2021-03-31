# builders 

## python

```
kp builder create py-builder \
--tag gcr.io/pa-ccollicutt/build-service/paketo-buildpacks_python \
--order tiny.yaml \
--stack base \
--store paketostore \
--namespace default
```


kp builder create py-builder \
--tag gcr.io/pa-ccollicutt/build-service/paketo-buildpacks_python \
--order python.yaml \
--stack base \
--store default \
--namespace default
```