#!/bin/bash

for (( i = 0; i <= 10; i++ ))
do

  # Check if queue is running
  if ps aux | grep "[p]hp /opt/gw2-api/artisan queue:listen" > /dev/null
  then
    echo "Running"
  else
    php /opt/gw2-api/artisan queue:listen --sleep=3 --tries=3
  fi
  sleep 5

done

