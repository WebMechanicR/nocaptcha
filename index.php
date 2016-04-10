<?php

error_reporting(E_ALL && ~E_NOTICE);
set_time_limit(4*60);

$keys = array(
    "583234",
    "9623974"
);
	
$key = $_REQUEST['key'];

if(in_array($key, $keys)){
    $type = $_REQUEST['type'];
    
    $limit_of_process = 2;
    $one_process_timing = 4*60;
    
    if($type == "google_no_captcha"){
	
	$site_key = $_GET['site_key'];
	$site_url = $_GET['site_url'];
	$proxy = $_GET['proxy'];
	$proxy_userpw = $_GET['proxy_userpw'];
	
	if(!$site_key or !$site_url){
	    echo 'Site key and site url are required!';
	}
	/*
	else if(!$proxy){
	    echo 'Proxy parameter required!';
	}*/
	else{
	    exec("cd ".escapeshellarg(__DIR__));
	    
	    
	    $process_id = mt_rand();
	    if($limit_of_process){
		$fp = fopen('queue_limits.txt', 'r+');
		flock($fp, LOCK_EX);
		$current = @unserialize(fread($fp, 10000));
		ftruncate($fp, 0);
		rewind($fp);
		if(!$current){
		    $current = array();
		}
		$c = 0;
		$for_deleting = array();
		foreach($current as $key => $item)
		{
		    if(time() - $item > $one_process_timing){
			$for_deleting[] = $key;
		    }
		    else
			$c++;
		}
		if($for_deleting)
		    foreach($for_deleting as $i)
			unset($current[$i]);
		
		if($c >= $limit_of_process){
		    fwrite($fp, serialize($current));
		    flock($fp, LOCK_UN);
		    fclose($fp);
		    echo "QUEUE LIMIT REACHED!";
		    exit;
		}
		
		$current[$process_id] = time();
		fwrite($fp, serialize($current));
		flock($fp, LOCK_UN);
		fclose($fp);
	    }
	    
	    $command = "";
	    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
		$command = '"C:\Program Files (x86)\phantomjs\bin\phantomjs.exe" --web-security=false main.js '.escapeshellarg($site_key).' '.escapeshellarg($site_url);
	    }
	    else{
		 $command = './phantomjs --web-security=false main.js '.escapeshellarg($site_key).' '.escapeshellarg($site_url);
		
	    }
	    
	    if($proxy){
		$command .= ' '.escapeshellarg($proxy);
	    }
	    if($proxy_userpw){
		$command .= ' '.escapeshellarg($proxy_userpw);
	    }
	    
	   $command .= ' 2>&1';
	   
	   $result = exec($command);
	   if($limit_of_process){
		$fp = fopen('queue_limits.txt', 'r+');
		flock($fp, LOCK_EX);
		$current = @unserialize(fread($fp, 10000));
		ftruncate($fp, 0);
		rewind($fp);
		if($current and isset($current[$process_id]))
		    unset($current[$process_id]);
		fwrite($fp, serialize($current));
		flock($fp, LOCK_UN);
		fclose($fp);
	    }
	   
	    //header("Content-type: text/html; charset=utf-8");
	    $response = "FAILURE!";
	    if(preg_match("/\|\*\*\|(.+?)\|\*\*\|/isu", $result, $pockets)){
		$response = "\n#CAPTCHAOK:".$pockets[1];
	    }
	    echo $response;
	    //echo $result;
	}
    }
    else if($type == "google_no_captcha_status"){
	if ($limit_of_process) {
	    $fp = fopen('queue_limits.txt', 'r+');
	    flock($fp, LOCK_EX);
	    $current = @unserialize(fread($fp, 10000));
	    ftruncate($fp, 0);
	    rewind($fp);
	    if (!$current) {
		$current = array();
	    }
	    $c = 0;
	    $for_deleting = array();
	    foreach ($current as $key => $item) {
		if (time() - $item > $one_process_timing) {
		    $for_deleting[] = $key;
		} else
		    $c++;
	    }
	    
	    if ($for_deleting)
		foreach ($for_deleting as $i)
		    unset($current[$i]);

	    if ($c >= $limit_of_process) {
		fwrite($fp, serialize($current));
		flock($fp, LOCK_UN);
		fclose($fp);
		echo "BUSY!";
		exit;
	    }

	    fwrite($fp, serialize($current));
	    flock($fp, LOCK_UN);
	    fclose($fp);
	    
	}
	echo "FREE!";
	exit;
    }
    if($type == "simple_image"){
        
        if($_FILES['image_content']){
            $uploadfile = "img/simple_image".mt_rand().'_'.mt_rand().'_'.$_FILES['image_content']['name'];
            if(@move_uploaded_file($_FILES['image_content']['tmp_name'], $uploadfile)){
                $params = json_encode(array('imagePath' => $uploadfile));
                
                $command = 'php query.php "ANTIGATE" "'.str_replace('"', '\\"', $params).'"';
                $result = exec($command);
                $response = "FAILURE!";
                if(preg_match("/CAPTCHAOK:(.+)/isu", $result, $pockets)){
                    $res = trim($pockets[1]);
                    if($res)
                        $response = "\n#CAPTCHAOK:".$pockets[1];
                }
                echo $response;
            }
            else{
                echo 'error in recieving image!';
            }
        }
        else
            echo 'you must send image file!';
    }
    else{
	echo "unknown type of captcha!";
    }
}
else{
    echo 'wrong key!';
}

?>