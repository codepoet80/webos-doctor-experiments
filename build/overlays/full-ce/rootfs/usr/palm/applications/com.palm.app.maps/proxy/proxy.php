<?PHP
	$inPath = $_SERVER["QUERY_STRING"];
	//
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $inPath);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	echo curl_exec($ch);
?>