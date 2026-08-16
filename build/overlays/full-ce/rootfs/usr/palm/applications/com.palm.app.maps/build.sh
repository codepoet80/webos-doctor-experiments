#!/bin/sh

# This is a test package to facilitate packaging the application outside of the 
# OE build environment.  Current development is being done by David Woods.  


echo "env is set to "
set
echo "Checking for BuildResults directory"
ls `pwd`

if [ "$SVN_USER" = 'phoenix daemon' ]; then
	echo "Testing Phoenix section."
	echo "Making BuildResults Directory"
	mkdir `pwd`/BuildResults	
	mkdir -p `pwd`/build-dir/working
	cp -f `pwd`/build-dir/*.* build-dir/working
else
	echo "Testing User Section"
	echo "Cleaning previous Results"
	rm -rf BuildResults
	rm -rf build-dir
	echo "Making BuildResults Directory"
	mkdir `pwd`/BuildResults
	mkdir -p `pwd`/build-dir/working
	cp -f `pwd`/*.* build-dir/working
fi
	echo "Building the package"
	palm-package `pwd`/build-dir/working -o `pwd`/BuildResults
