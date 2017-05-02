<?php
require_once(__DIR__.'/classes/database.php');//Note: __DIR__ ensures that the path is relative. If file2 includes file3 and file1 includes file2, the include for file2 to include file3 will be wrong.
require_once(__DIR__.'/classes/session.php');
require_once(__DIR__.'/api-errors.php');

class apiHandler {
  protected $db;
  protected $session;
  protected $key;
  protected $return;

  //---------------//
  //   CONSTRUCT   //
  //---------------//
  public function __construct(){//called on object creation, creating two new objects from two different classes.
    $this->db = new database();//$this references the current object
    $this->session = new session();//new initializes object
  }

  //---------------------------//
  //       PUBLIC METHODS      //
  //---------------------------//
  public function init(){
    ifFails($this->db->connect(), 503);

  }

  public function execute($method, $path, $json = array()){

    $this->key = $path;

    //Methods allowed if not logged in
    switch($method){
      case 'GET':
        if($path === 'login'){
          if(isset($_SESSION['email'])){
            $this->session->save($this->db->getUser($_SESSION['email']));
          }
          return $this->process($this->session->data());
        }else if($path === 'counties'){
          return $this->process($this->db->getCounties());
        }else if($path === 'bond/types'){
          return $this->process($this->db->getBondTypes());
        }else if($path === 'offense/types'){
          return $this->process($this->db->getOffenseTypes());
        }else if($path === 'usage'){
          if(isset($json['usage_password']) && $json['usage_password'] === 'c0b_admin'){
            return $this->process($this->db->getUsage());
          }else{
            ifFails(null, 403);
          }
        }
        break;
      case 'POST':
        if($path === 'login'){
          $user = $this->db->checkLogin($json['email'], $json['password']);
          if($user){
            return $this->process($this->session->save($user));
          }else{
            return $this->return[$this->key] = false;
          }
        }else if($path === 'register/user'){
          //If the registration is successful, log them in
          if($this->process($this->db->registerUser($json))){
            $user = $this->db->checkLogin($json['email'], $json['password']);
            if($user){
              $this->session->save($user);
            }else{
              return null;
            }
          }
          return $this->return;
        }else if($path === 'reset/password/mobile'){
          return $this->process($this->db->requestResetPasswordViaMobile($json));
        }else if($path === 'reset/password/email'){
          return $this->process($this->db->requestResetPasswordViaEmail($json));
        }
        break;
      case 'PUT':
        if($path === 'reset/password/mobile'){
          return $this->process($this->db->resetPasswordViaMobile($json));
        }else if($path === 'reset/password/email'){
          return $this->process($this->db->resetPasswordViaEmail($json));
        }
        break;
      case 'DELETE':
        if($path === 'login'){
          return $this->process($this->session->stop());
        }
        break;
    }

    //Methods only allowed if logged in
    if($this->session->loggedIn()){
      switch($method){
        case 'GET':
          if($path === 'submit/referral'){
            return $this->process($this->db->getSubmittedReferrals($_SESSION['email']));
          }else if($path === 'assigned/referrals'){
            return $this->process($this->db->getAssignedReferrals($_SESSION['email']));
          }else if($path === 'offered/referrals'){
            return $this->process($this->db->getOfferedReferrals($_SESSION['email']));
          }
          break;
        case 'POST':
          if($path === 'submit/referral' && $_SESSION['active'] == 1){
            $json['referee_email'] = $_SESSION['email'];
            return $this->process($this->db->addReferral($json, $_SESSION['email']));
          }
          break;
        case 'PUT':
          if($path === 'assigned/referral' && $_SESSION['active'] == 1){
            return $this->process($this->db->updateAssignedReferral($json));
          }else if($path === 'user'){
            $json['original_email'] = $_SESSION['email'];
            $this->process($this->db->updateUser($json));
            //save the changes in the sessions
            ifFails($user = $this->db->getUser($json['original_email']), 500);
            ifFails($this->session->save($user), 500);
            return $this->return;
          }
          break;
        case 'DELETE':
          break;
      }
    }

    //Not a valid request
    return null;
  }

  public function close(){
    $this->db->close();
  }

  //---------------------------//
  //      PRIVATE METHODS      //
  //---------------------------//
  protected function process($result){
    if(ifFails($this->return[$this->key] = $result, 500)){
      return $this->return;
    }else{
      return null;
    }
  }
}
?>
