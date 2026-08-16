<?php
/**
* To develop AC in the browser we must proxy the Ajax requests to get around
* the cross domain XHR security model.
*
* NOTE: Put this file under an Apache server (with PHP support) 
* and update the path to it in your app/setup.js file.
*/

header('Content-type: application/json');

$request_headers = apache_request_headers();
$post_headers = Array("Content-Type: application/json; charset=UTF-8");
$auth_headers = Array("Authorization", "X-Palm-Device-Id", "X-Palm-Profile-Email", "X-Palm-AppCat-Caller-ID", "X-Palm-AppCat-Caller-Version");

foreach ($auth_headers as $header) {
  $post_headers[] = "$header: $request_headers[$header]";
}

//print_r($post_headers);

//    $request_headers = new Array(
//      "Authorization: PalmAuth token=V0F72BCAB12B654BD63C2C165000A7178",
//      "X-Palm-Device-Id: MEID:127C77667559126",
//      "X-Palm-Profile-Email: cat_recq8df853a8@palm.com",
//      "X-Palm-AppCat-Caller-ID: acc",
//      "X-Palm-AppCat-Caller-Version: 4.0.0"
//    )


$url = isset($request_headers['Endpoint']) ? $request_headers['Endpoint'] : '';
//echo "{'url': '$url'}";

if (empty($url)) {
    exit;
}

$curl = curl_init();
curl_setopt($curl, CURLOPT_HEADER, false);
curl_setopt($curl, CURLOPT_HTTPHEADER, $post_headers);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_URL, $url);

$data = curl_exec($curl);
curl_close($curl);

echo $data;
?>
