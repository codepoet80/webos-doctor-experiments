#!/bin/sh
# Begin /usr/sbin/remove-expired-certs.sh
# modified for webOS the original source is listed below
# source: http://www.linuxfromscratch.org/blfs/view/svn/postlfs/cacerts.html
#
# Version 20120211
#
# Make sure the date is parsed correctly on all systems
mydate()
{
  local y=$( echo $1 | cut -d" " -f4 )
  local M=$( echo $1 | cut -d" " -f1 )
  local d=$( echo $1 | cut -d" " -f2 )
  local m

  if [ ${d} -lt 10 ]; then d="0${d}"; fi

  case $M in
    Jan) m="01";;
    Feb) m="02";;
    Mar) m="03";;
    Apr) m="04";;
    May) m="05";;
    Jun) m="06";;
    Jul) m="07";;
    Aug) m="08";;
    Sep) m="09";;
    Oct) m="10";;
    Nov) m="11";;
    Dec) m="12";;
  esac

  certdate="${y}${m}${d}"
}

OPENSSL=/usr/bin/openssl
DIR=/etc/ssl/certs/trustedcerts
BACKDIR=$( pwd )
if [ $# -gt 0 ] && [ -d "$1" ] ; then
  DIR="$1"
fi
if [ -L ${DIR} ]; then
    echo "cannot verify against a symlink dir"
    exit 0
fi
# busybox find
cd ${DIR}
certs=$( find -type f )
today=$( date +%Y%m%d )

for cert in $certs; do
  if [ -e "${cert}" ]; then
    EXT=$(echo ${cert} | sed -nr 's/.*\.([^\.]+)$/\1/p')
    if [ "${EXT}" = "pem" ] || [ "${EXT}" = "cer" ] || [ "${EXT}" = "der" ] || [ "${EXT}" = "crt" ]; then
       FTYPE=$(cat "${cert}" | sed -n '/CERTIFICATE/p')
        if [ ${#FTYPE} -gt 0 ]; then
           CMD=" "
        else
           CMD=" -inform der "
        fi
    else
        echo "unsupported extension ${cert}"
        continue
    fi
  else
    echo "no file found ${cert}"
    continue
  fi
  notafter=$( $OPENSSL x509 -enddate -in ${cert}${CMD}-noout )
  date=$( echo ${notafter} |  sed 's/^notAfter=//' )
  mydate "$date"

  if [ ${certdate} -lt ${today} ]; then
     echo "${cert} expired on ${certdate}! Removing..."
     rm -f "${cert}"
  fi
done
cd ${BACKDIR}
