<?php
class session {
  protected $sessionValues = array(
    'id',
    'company',
    'address',
    'active',
    'firstname',
    'lastname',
    'role',
    'phone',
    'email',
    'fips_code'
  );

  //---------------//
  //   CONSTRUCT   //
  //---------------//
  public function __construct(){
    session_start();
  }

  //---------------------------//
  //    CONNECTION METHODS     //
  //---------------------------//
  public function save($row){
    for($i=0; $i<count($this->sessionValues); $i++){
      $_SESSION[$this->sessionValues[$i]] = $row[$this->sessionValues[$i]];
    }
    return true;
  }

  public function loggedIn(){
    return isset($_SESSION['email']);
  }

  public function data(){
    if($this->loggedIn()){
      $data = array();
      for($i=0; $i<count($this->sessionValues); $i++){
        $data[$this->sessionValues[$i]] = $_SESSION[$this->sessionValues[$i]];
      }
      return $data;
    }else{
      $this->stop();
      return false;
    }
  }

  public function stop(){
    if($this->loggedIn()){
      for($i=0; $i<count($this->sessionValues); $i++){
        unset($_SESSION[$this->sessionValues[$i]]);
      }
      session_unset();
      session_destroy();
      return 'Logged out';
    }else{
      return 'User was not logged in';
    }
  }
}
?>
