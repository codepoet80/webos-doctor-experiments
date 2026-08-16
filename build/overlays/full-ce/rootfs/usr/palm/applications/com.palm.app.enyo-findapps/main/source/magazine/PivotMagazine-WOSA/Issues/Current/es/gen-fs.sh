#!/bin/bash

fs='';
for f in `find . -type f -print | egrep '(\.js$|\.png$|\.jpg$|\.gif$|\.json$|\.css$)'`
do
    if [ ${#fs} -gt 0 ]; then
        fs=$fs",\\n"
    fi
    #echo $f
    fs=$fs\"$f\"
    #echo $fs
done
echo -e "{\"fileset\" : ["$fs"]}" > fileset.json