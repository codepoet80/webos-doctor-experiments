#!/bin/bash
if [ "$#" -eq 1 ]; then 
	fs='{"publishDate":"06/01/2011 12:00:00",';
	fs=$fs"\\n"
	fileset='';
	declare -i pacSize;
	for f in `find . -type f -print | egrep '(\.js$|\.png$|\.jpg$|\.gif$|\.json$|\.css$)'`
	do
		# logical path
		logPath=${f:2};
		echo $logPath;
		if [ $logPath != "manifest.json" ]; then
			onefile={;
			# logical path
			onefile=$onefile\"logicalPath\":\"$logPath\",;
			# checksum
			
			fChecksum=`md5sum $f`;
			spaceindex=`expr index "$fChecksum" ' '`
			fChecksum=${fChecksum:0:($spaceindex-1)};
			onefile=$onefile\"checksum\":\"$fChecksum\",;
			# section
			fSection=${logPath:0:`expr index "$logPath" /`-1};
			onefile=$onefile\"section\":\"$fSection\",;
			# type
			fType="txt";
			case $logPath in
			     *.jpg) fType="image";;
			     *.png) fType="image";;
			     *.gif) fType="image";;
			     *.bmp) fType="image";;
			     *.lo.js) fType="layout";;
			      *.json) fType="binding";;
			     *.css) fType="css";;
			esac
			onefile=$onefile\"type\":\"$fType\",;
			
			#edition
			onefile=$onefile\"edition\":1,;
			#physical path
			onefile=$onefile\"physicalPath\":\"source/magazine/defaultEdition/en/$logPath\",;
			
			# size
			fSize=$(stat -c%s "$f");
			pacSize=$pacSize+$fSize;
			onefile=$onefile\"size\":$fSize};
			
		    if [ ${#fileset} -gt 0 ]; then
		        fileset=$fileset,\\n
		    fi
		    
		    fileset=$fileset$onefile
		fi    
	    
	done
	fileset=[$fileset]
	fs=$fs\"results\":$fileset,;
	# numPages
	fs=$fs\"numPages\":$1,;
	# packageSize
	fs=$fs\"packageSize\":$pacSize}
	echo -e $fs > manifest.json
else
    echo "Please enter the total number of pages in the edition as input";
    exit 1;
fi
