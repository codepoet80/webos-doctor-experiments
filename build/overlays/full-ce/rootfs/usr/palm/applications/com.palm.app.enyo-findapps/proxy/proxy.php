<?php
/**
* To develop AC in the browser we must proxy the Ajax requests to get around
* the cross domain XHR security model.
*
* NOTE: Put this file under an Apache server (with PHP support) 
* and update the path to it in your app/setup.js file.
*/

header('Content-type: application/json');

$url = isset($_POST['url']) ? $_POST['url'] : '';
$payload = isset($_POST['payload']) ? $_POST['payload'] : '';

/*
//TEST CODE
$env = 'sbqa';
$apiCall = 'appDetail_ext2';
$payload = '{
                "InGetAppDetailV2" : {
                    "accountTokenInfo" : {
                        "token" : "UE002A07E4B04391250DB37DE69111DA6",
                        "deviceId" : "MEID:A10000064202BD",
                        "email" : "chad@sbqa.com"
                    },
                    "packageId": "com.kquinn.auto.1vpnst2v65jww",
                    "locale": "en_US"
                }
            }';
*/

if (empty($url) || empty($payload)) {
    exit;
}

$curl = curl_init();
curl_setopt($curl, CURLOPT_HEADER, false);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_HTTPHEADER, Array("Content-Type: application/json; charset=UTF-8"));
curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL, $url);

$data = curl_exec($curl);
curl_close($curl);

echo $data;
?>
