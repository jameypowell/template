<?php
  //This is the Instant Payment Notification Listener for Paypal Payments
  /*
    Example data that Paypal will post to this url
    {
     "amount1":"0.00",
     "amount3":"299.99",
     "address_status":"confirmed",
     "subscr_date":"20:35:50 Feb 07, 2017 PST",
     "payer_id":"EFX64MVVGE46W",
     "address_street":"1 Main St",
     "mc_amount1":"0.00",
     "mc_amount3":"299.99",
     "charset":"windows-1252",
     "address_zip":"95131",
     "first_name":"Mathieu",
     "option_selection1":"Monthly",
     "reattempt":"1",
     "address_country_code":"US",
     "address_name":"Mathieu Lessard",
     "notify_version":"3.8",
     "subscr_id":"I-5G8SHVHR89FT",
     "custom":"52",
     "payer_status":"verified",
     "business":"conciergeofbailllc-facilitator@gmail.com",
     "address_country":"United States",
     "address_city":"San Jose",
     "verify_sign":"AS54rPUCw9wOTuVl0m1aSg09HaI8AWR5-CykU8Yd1iJlh.nubZkR1lw4",
     "payer_email":"test@mathieu-lessard.com",
     "option_name1":"Subscription Options",
     "btn_id":"3535321",
     "last_name":"Lessard",
     "address_state":"CA",
     "receiver_email":"conciergeofbailllc-facilitator@gmail.com",
     "recurring":"1",
     "txn_type":"subscr_signup",
     "item_name":"Concierge of Bail - Subscription (Sandbox)",
     "mc_currency":"USD",
     "residence_country":"US",
     "test_ipn":"1",
     "period1":"2 M",
     "period3":"1 M",
     "ipn_track_id":"32c1befcd9980"
    }

  */
  require_once(__DIR__.'/classes/database.php');
  $transaction = uniqid();
  @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> " . str_replace("\n","\\n",json_encode($_POST))."\n", FILE_APPEND);

  $json = file_get_contents("/var/www/config.json");
  $json = json_decode($json, true);
  $prod = isset($json['thisIsProd']) && $json['thisIsProd'];

  //Step 1: Make sure this came from Paypal
  //Example: https://github.com/paypal/ipn-code-samples/blob/master/php/PaypalIPN.php
  $verifyUrl = $prod ? 'https://ipnpb.paypal.com/cgi-bin/webscr' : 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';
  if(!count($_POST)){
    @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> Missing POST Data\n", FILE_APPEND);
    throw new Exception("Missing POST Data");
  }
  $raw_post_data = file_get_contents('php://input');
  $raw_post_array = explode('&', $raw_post_data);
  $myPost = array();
  foreach($raw_post_array as $keyval){
    $keyval = explode('=', $keyval);
    if(count($keyval) === 2){
      // Since we do not want the plus in the datetime string to be encoded to a space, we manually encode it.
      if($keyval[0] === 'payment_date'){
        if(substr_count($keyval[1], '+') === 1){
          $keyval[1] = str_replace('+', '%2B', $keyval[1]);
        }
      }
      $myPost[$keyval[0]] = urldecode($keyval[1]);
    }
  }
  // Build the body of the verification post request, adding the _notify-validate command.
  $req = 'cmd=_notify-validate';
  foreach($myPost as $key => $value){
    if(get_magic_quotes_gpc() == 1){
      $value = urlencode(stripslashes($value));
    }else{
      $value = urlencode($value);
    }
    $req .= "&$key=$value";
  }
  // Post the data back to PayPal, using curl. Throw exceptions if errors occur.
  $ch = curl_init($verifyUrl);
  curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $req);
  curl_setopt($ch, CURLOPT_SSLVERSION, 6);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1);
  curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
  curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);
  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
  curl_setopt($ch, CURLOPT_HTTPHEADER, array('Connection: Close'));
  $res = curl_exec($ch);
  if(!($res)){
    $errno = curl_errno($ch);
    $errstr = curl_error($ch);
    curl_close($ch);
    @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> cURL error: [$errno] $errstr\n", FILE_APPEND);
    throw new Exception("cURL error: [$errno] $errstr");
  }
  $info = curl_getinfo($ch);
  $http_code = $info['http_code'];
  if($http_code != 200){
    @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> PayPal responded with http code $http_code\n", FILE_APPEND);
    throw new Exception("PayPal responded with http code $http_code");
  }
  curl_close($ch);
  // Check if PayPal verifies the IPN data, and if so, return true.
  if($res == 'VERIFIED'){
    @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> Verified call was from PayPal\n", FILE_APPEND);

    //Step 2: process the data
    $db = new database();
    $db->connect();
    //Not handling subscr_cancel or subscr_modify

    //On Trials, the user is signed up, but no payment call with be sent through. The account needs to be activated
    if($_POST['txn_type'] === 'subscr_signup'){
      $db->acknowledgePaypalIPN($_POST['custom'], true);
      @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> ACTIVATED due to signup\n", FILE_APPEND);
    }else if($_POST['txn_type'] === 'subscr_payment'){
      //If we get a payment, and the payment was successful, activate their account
      if(in_array($_POST['payment_status'], array('Completed', 'Pending', 'Processed'))){
        $db->acknowledgePaypalIPN($_POST['custom'], true);
        @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> ACTIVATED successful payment\n", FILE_APPEND);
      }else if(in_array($_POST['payment_status'], array('Denied', 'Expired', 'Failed'))){
        $db->acknowledgePaypalIPN($_POST['custom'], false);
        @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> DEACTIVATED unsuccessful payment\n", FILE_APPEND);
      }
    }else if(in_array($_POST['txn_type'], array('subscr_failed', 'subscr_eot'))){
      $db->acknowledgePaypalIPN($_POST['custom'], false);
      @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> DEACTIVATED payment failed or stopped paying and time ran out\n", FILE_APPEND);
    }
    $db->close();
  }else{
    @file_put_contents('/var/log/ipn', date("Y-m-d H:i:s") . " ($transaction) -> WARNING: call was NOT from PayPal\n", FILE_APPEND);
    throw new Exception("Call was NOT from PayPal");
  }

?>
