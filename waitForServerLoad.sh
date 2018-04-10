#!/usr/bin/env bash
gem update --system
res=1;
iter=10;
while "$res" -ne 0 && $"iter" -ne 0
do
 curl http::localhost:9292
 res=$?
 printf "Return value of curl:%d","$res"
 sleep 5s #Sleep for 5 seconds in between curl calls...
 iter=$iter-1;
 printf "Iteration #:%d","$iter")
done

exit $res

