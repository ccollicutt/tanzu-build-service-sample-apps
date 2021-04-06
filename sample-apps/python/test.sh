#!/bin/bash

i=0

until [ $i -gt 500 ]
do
  curl localhost:5000/style/$i/make 
  ((i=i+1))
  sleep 1
done

