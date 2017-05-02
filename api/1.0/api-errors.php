<?php
$transaction = uniqid();
function deliver_response($httpStatus = 200, $message = ''){
  global $return, $cb;
  header("HTTP/1.1 $httpStatus $message");

  if($message !== '')
    $return['message'] = $message;

	cob_log(array('STATUS' => $return['status'],'MESSAGE' => $message));

  return json_encode($return);
}

function cob_log($values){
  global $transaction;
  @file_put_contents('/var/log/cob', date("Y-m-d H:i:s") . " ($transaction) -> " . str_replace("\n","\\n",json_encode($values))."\n", FILE_APPEND);
}

function ifFails($var, $code = 500, $message = ''){
  global $transaction;

  $type = gettype($var);
  if($type === 'array' || $type === 'object'){
    $data = 'count '.count($var);
  }else{
    $data = $var;
  }
	cob_log(array('STEP', $data));
  if($var === null){
    try{
      switch($code){
  			case 401: throw new Exception("Invalid request, Login Required.",$code); break;
        case 403: throw new Exception("You do not have perimission to preform this action.",$code); break;
        case 404: throw new Exception("Request with sent parameters not found.",$code); break;
        case 501: throw new Exception("Database Error => ".$message,$code); break;
        case 503: throw new Exception("Could not connect to resource.",$code); break;
    		default: throw new Exception("A server error occured.",500); break;
      }
    }catch(Exception $e){
      die(deliver_response($e->getCode(), $e->getMessage()));
    }
  }else{
    return true;
  }
}

?>
