#!/usr/bin/env bash
gem update --system
res=1;
while "$res" -ne 0
do
 curl http::localhost:9292
 res=$?
 echo "Return value of curl..."
 echo res
done

exit $res

