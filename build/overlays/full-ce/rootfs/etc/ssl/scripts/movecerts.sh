#!/bin/sh
#
# script to move certs from one directory to another
# comparing subject hashes and fingerprints
# moving if it doesn't exist in target and creating a hash link for it
#
#
TARGETDIR=/etc/ssl/certs/trustedcerts
SRCDIR=/etc/ssl/scripts/rootcerts
DEBUG=""
BACKDIR=$(pwd)
if [ $# -gt 0 ]; then
    if [ -d "$1" ]; then
        SRCDIR="$1"
    fi
    if [ -d "$2" ]; then
        TARGETDIR="$2"
    fi
fi
if [ ! -d ${TARGETDIR} ] || [ ! -d ${SRCDIR} ]; then
    echo "error finding ${TARGETDIR} and ${SRCDIR}"
    exit 1
fi

if [ -L ${SRCDIR} ]; then
    echo "source: ${SRCDIR} is a symlink, will not move files"
    exit 0
fi

if [ -L ${TARGETDIR} ]; then
    echo "source: ${TARGETDIR} is a symlink, will not move files"
    exit 0
fi

if [ "${SRCDIR}" = "${TARGETDIR}" ]; then
    echo "source: ${SRCDIR} is the same as target, will not move files"
    exit 0
fi


echo "Using target: ${TARGETDIR} and source: ${SRCDIR}"
cd ${SRCDIR}
CERTS=$(find -type f )
cd ${TARGETDIR}
count=1
mcount=0
pc=0
palmCerts=""
for CERT in $CERTS; do
    CERTNAME=""$(echo "${CERT}" | sed -nr  's|^(\.\/)(.*)|\2|p')
    if [ -z "${CERTNAME}" ]; then
         echo "unsupported file ${CERT}"
         continue
    fi
    if [ -e "${SRCDIR}/${CERTNAME}"  ]; then
        EXT=$(echo "${CERTNAME}" | sed -nr 's/.*\.([^\.]+)$/\1/p')
        if [ "${EXT}" = "pem" ] || [ "${EXT}" = "cer" ] || [ "${EXT}" = "der" ] || [ "${EXT}" = "crt" ]; then
           FTYPE=$(cat "${SRCDIR}/${CERTNAME}" | sed -n '/CERTIFICATE/p')
            if [ ${#FTYPE} -gt 0 ]; then
               CMD=" "
            else
               CMD=" -inform der "
            fi
        else
            echo "unsupported extension ${CERTNAME}"
            continue
        fi
    else
        echo "no file found ${CERTNAME}"
        continue
    fi
  subject=$(openssl x509 -noout -in "${SRCDIR}/${CERTNAME}"${CMD}-subject -nameopt RFC2253)
  subtext=$(echo "${subject}" | sed -r 's/Email=[^,]+//' \
   | sed -r 's/ST=[^,]+//'| sed -r 's/[^,]?http[^,]+//g' \
   | sed -r 's/[^,]?(\/)[^,]+//g'\
   | sed -r 's/[^,]+@[^,]+//g'| sed -r 's/L=[^,]+//'\
   | sed -r 's/[^,]?erms of use[^,]+//g'| sed -r 's/[^,]?authorized use[^,]+//g'\
   | sed -r 's/[^,]?\(c\)[^,]+//g'| sed -r 's/(-)+/_/g'| sed -r 's/[ ,]+//g'\
   | sed 's|\(.*\)[_]$|\1|'| tr -d '\\.\\/'| tr -d '\\(\\)')
#  echo -n "${count} "
#  echo ${subtext}
  matchNums=""
  noMatchNum=0
  HASH=$(openssl x509 -noout -in "${SRCDIR}/${CERTNAME}"${CMD}-hash)
  if [ -z ${HASH} ]; then
      echo "bad hash for file: ${CERTNAME}"
      continue
  fi
  if [ -e "${HASH}.0" ]; then
   FINGER1=$(openssl x509 -in "${SRCDIR}/${CERTNAME}"${CMD}-fingerprint -noout | sed -r 's/.*Fingerprint=(.*)/\1/'|sed -r 's/://g')
   testfiles=$(ls -1 ${HASH}.*)
   testL=0 #number of matches

   for file in $testfiles; do
    let testL=testL+1
   done
#   echo "files matching ${testL}"
   for file in $testfiles; do
     fileNo=$(echo ${file} | sed 's/.*\.\([0-9]\)$/\1/')
     FTYPE2=$(cat ${file} | sed -n '/CERTIFICATE/p')
     if [ ${#FTYPE2} -gt 0 ]; then
       CMD2=" "
     else
       CMD2=" -inform der "
     fi
     FINGER2=$(openssl x509 -noout -in "${file}"${CMD2}-fingerprint | sed -r 's/.*Fingerprint=(.*)/\1/'|sed -r 's/://g')
     if [ $FINGER1 != $FINGER2 ]; then
#       echo "${FINGER1} NOT equal ${FINGER2}"
       if [ $fileNo -ge $noMatchNum ]; then
         noMatchNum=$(($fileNo+1))
       fi
     else
#       echo "${FINGER1} Equals ${FINGER2}"
       # echo "breaking"
       matchNums="${file}"
       break
     fi
   done
  fi

  if [ -z ${matchNums} ] && [ -n ${HASH} ] && [ -f ${SRCDIR}/${CERTNAME} ]; then
    [ -z ${DEBUG} ] && mv -f "${SRCDIR}/${CERTNAME}" "${TARGETDIR}/"
 #   echo "moved ${SRCDIR}/${CERTNAME}"
    [ -z ${DEBUG} ] && $(ln -sf "${CERTNAME}" "${HASH}.${noMatchNum}" )
 #   echo "made link with ${HASH}.${noMatchNum} "
    let mcount=mcount+1
#  elif [ -n ${matchNums} ]; then
#    echo "file exists, hash is ${matchNums}"
  fi

  palm=$(echo ${subtext} |  sed -rn 's/.*WebOS.*/&/p')
  if [ ${#palm} -gt 0 ]; then
    palmCerts="${palm};${palmCerts}"
	let pc=pc+1
  fi
  let count=count+1
done
echo "number of certs moved and hash links made: ${mcount}"
echo "number of palm certs: ${pc}"
echo ${palmCerts}
cd "${BACKDIR}"
exit 0
