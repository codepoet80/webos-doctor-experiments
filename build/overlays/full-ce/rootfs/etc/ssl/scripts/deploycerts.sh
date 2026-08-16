#!/bin/sh
#
#  update the root certs in webos
#
#
OPENSSL=/usr/bin/openssl
CERTDIR=/etc/ssl/certs/trustedcerts
VARDIR=/var/ssl
SCRIPTS=$(pwd)
RTCERTS="${SCRIPTS}/rootcerts"
if [ ! -x ${OPENSSL} ]; then
	echo " skipped ('openssl' program not available)\n";
	exit 1
fi

if [ ! -d ${SCRIPTS} ] || [ ! -d ${RTCERTS} ]; then
    echo "Required files not found on the device"
    exit 1
fi

cd ${SCRIPTS}

# cleanup expired certs
echo "checking ${CERTDIR} for expired certs"
./cleancerts.sh ${CERTDIR}
echo "removing any dead sym links"
find ${CERTDIR} -follow -type l -delete
echo "verify hash links in ${CERTDIR}"
./verifylinks.sh ${CERTDIR}

if [ -L ${VARDIR}/certs ]; then
    echo "/var/ssl/certs is symlinked"
else
    echo "backing up ${VARDIR}/certs"
    $(cd ${VARDIR}/certs ; find . -print0 | tar -zcf ${SCRIPTS}/varcerts.tar.gz --transform='s#./##' --null -T - )
    if [ ! -f ${SCRIPTS}/varcerts.tar.gz ]; then
        echo "error backing up ${VARDIR}/certs, exiting root certs not updated!"
        exit 1
    fi
    echo "checking ${VARDIR}/certs for expired certs"
    ./cleancerts.sh ${VARDIR}/certs
    echo "removing any dead sym links in ${VARDIR}/certs"
    find ${VARDIR}/certs -follow -type l -delete
    echo "verify links in ${VARDIR}/certs"
    ./verifylinks.sh ${VARDIR}/certs
fi
echo "updating rootcerts"
rm -f "rootsmoved.txt"
rm -f "untrusted.txt"
./movecerts.sh ${RTCERTS} ${CERTDIR} > "rootsmoved.txt"
echo "checking for revoked certs"
untrusted="rootcerts/untrusted.txt"
if [ -f ${untrusted} ]; then
    while read -r line; do
        if [ -e "${CERTDIR}/${line}.0" ]; then
            echo "found cert hash: ${line}"
            { ls -l "${CERTDIR}/${line}.*" >> untrusted.txt ; }
        else
            echo "hash: ${line} not found"
        fi
    done < "${untrusted}"
fi
echo "verify links in ${VARDIR}/trustedcerts"
find ${VARDIR}/trustedcerts -follow -type l -delete
./verifylinks.sh "${CERTDIR}" "${VARDIR}/trustedcerts"
exit 0
