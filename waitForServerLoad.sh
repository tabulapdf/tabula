#!/usr/bin/env bash
gem update --system
res=1;
iter=10;
while [[ "$res" -ne 0 ]] && [[ "$iter" -gt 0 ]]
do
 iter=$((iter-1));
 printf "Iteration #%d\n" "$((10-$iter))"
 curl -s http://localhost:9292/
 res=$?
 printf "Return value of curl:%d\n" "$res"
 sleep 5s #Sleep for 5 seconds in between curl calls...
done

if [[ "$res" -ne 0 ]]
then
  printf "Connection could not be made to server...\n"
fi

exit $res

