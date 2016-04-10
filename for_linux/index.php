<?php

error_reporting(E_ALL && ~E_NOTICE);
set_time_limit(3*60);

$keys = array(
    "583234",
    "9623974"
);
	
$key = $_REQUEST['key'];

if(in_array($key, $keys)){
    $type = $_REQUEST['type'];
    
    if($type == "google_no_captcha"){
	$site_key = $_GET['site_key'];
	$site_url = $_GET['site_url'];
	$proxy = $_GET['proxy'];
	$proxy_userpw = $_GET['proxy_userpw'];
	
	if(!$site_key or !$site_url){
	    echo 'Site key and site url are required!';
	}/*
	else if(!$proxy){
	    echo 'Proxy parameter required!';
	}*/
	else{
	   
	    exec("cd ".escapeshellarg(__DIR__));
	    
	    $command = './phantomjs --web-security=false main.js '.escapeshellarg($site_key).' '.escapeshellarg($site_url);
	    
	    if($proxy){
		$command .= ' '.escapeshellarg($proxy);
	    }
	    if($proxy_userpw){
		$command .= ' '.escapeshellarg($proxy_userpw);
	    }
	    
	    //$command .= ' 2>&1';
	    $result = exec($command);
	    
	    //header("Content-type: text/html; charset=utf-8");
	    $response = "FAILURE!";
	    if(preg_match("/\|\*\*\|(.+?)\|\*\*\|/isu", $result, $pockets)){
		$response = "OK:".$pockets[1];
	    }
	    echo $response;
	}
    }
    else{
	echo "unknown type of captcha!";
    }
}
else{
    echo 'wrong key!';
}

?>