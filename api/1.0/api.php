<?php
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

  /* API Steps
    1. Receive Request
    2. Log Request
    3. Route
    4. Check Authorize/Fulfill
    5. Return

    curl -X GET 'https://192.168.99.100/api/1.0/get/referrals.json' \
    -H 'X-Api-Key:test' -i \
    -d 'filter[format]=long&filter[ids]=2,3'
  */

  /******************
  **Initialization **
  ******************/
  $return = array('status'=>'fail');
  require_once(__DIR__.'/api-handler.php');
  require_once(__DIR__.'/api-errors.php');
	date_default_timezone_set('UTC');

  $api = new apiHandler();
  $api->init();

  /******************
  **Receive Request**
  ******************/

  //Process client request
  header("Content-Type:application/json");

  //TODO: Should validate filter is json, and decode it.
  /******************
  **  Log Request  **
  ******************/
  if($phpInput = file_get_contents("php://input")){
    $json = json_decode($phpInput, true);
    parse_str($phpInput);
  }else{
    //This is to workaround where parse_str put the payload
    parse_str($_SERVER['QUERY_STRING'],$json);
  }

	cob_log(array('SESSION' => $_SESSION, 'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'], 'PATH' => join("/",$_GET['path']), 'JSON' => $json));

  /******************
  **    Route      **
  ******************/
  $return['data'] = $api->execute($_SERVER['REQUEST_METHOD'], join("/",$_GET['path']), $json);
  if($return['data'] !== null){
    $return['status'] = 'success';
    echo deliver_response();
  }else{
    unset($return['data']);
    ifFails(null, 404);
  }

  $api->close();
?>
