#!/usr/bin/env bash
gem update --system
curl http::localhost:9292
res=$?
echo res

exit $res

