#!/usr/bin/env bash
gem update --system
res=1;
num_iter=100
iter="$num_iter";
while [[ "$res" -ne 0 ]] && [[ "$iter" -gt 0 ]]
do
 sleep 1m #Sleep for a minute in between curl calls...
 iter=$((iter-1));
 printf "Iteration #%d\n" "$(($num_iter-$iter))"
 curl -s http://localhost:9292/
 res=$?
 printf "Return value of curl:%d\n" "$res"
done

if [[ "$res" -ne 0 ]]
then
  printf "CONNECTION COULD NOT BE MADE TO SERVER...\n"
else
  printf "CONNECTION MADE TO SERVER: BEGINNING TEST CASES...\n"
fi

exit $res
