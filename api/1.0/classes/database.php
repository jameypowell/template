<?php
require_once(__DIR__.'/../api-errors.php');
//require_once('/usr/share/php/random_compat/random.php');
class database {
  // Protected Properties
  protected $dbUser;
  protected $dbPassword;
  protected $dbConnectionString;
	protected $salt1 = "de#@";
	protected $salt2 = "pg&*";
	protected $salt3 = "y@!r";

  //---------------//
  //   CONSTRUCT   //
  //---------------//
  public function __construct(){
    //Get the config file
    $json = file_get_contents("/var/www/config.json");
    $json = json_decode($json, true);
    $db = $json['database'];

    $this->dbUser             = $db['user'];
    $this->dbPassword         = $db['password'];
    $this->dbConnectionString = 'mysql:host='.$db['host'].';port='.$db['port'].';dbname='.$db['db'].';charset=utf8';
  }

  //---------------------------//
  //    CONNECTION METHODS     //
  //---------------------------//
  public function connect(){
    try{
      $this->db = new PDO($this->dbConnectionString, $this->dbUser, $this->dbPassword, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'"));
      return true;
    }catch(PDOException $e){
      return null;
    }
  }

  public function close(){
    $this->db = null;
  }

  //---------------------------//
  //       API METHODS         //
  //---------------------------//
  public function checkLogin($email, $password){

    //Create Query
    $sql = "SELECT
              u.id,
              u.active,
              u.firstname,
              u.lastname,
              u.password,
              r.name as role,
              u.phone,
              u.email,
              u.company,
              u.address,
              c.fips_code
            FROM
              user u
              left join role r on u.role = r.id
              left join county c on u.county = c.id
            WHERE
              email = :email LIMIT 1";
    $variables = array('email' => $email);

    //Execute Statement
    $results = $this->PDOExecute($sql, $variables);

    if(count($results) === 1 && $results[0]['password'] === $this->salt($password)){
      return $results[0];
    }else{
      return FALSE;
    }
  }

  public function getUser($email){

    //Create Query
    $sql = "SELECT
              u.id,
              u.active,
              u.firstname,
              u.lastname,
              r.name as role,
              u.phone,
              u.email,
              u.company,
              u.address,
              c.fips_code
            FROM
              user u
              left join role r on u.role = r.id
              left join county c on u.county = c.id
            WHERE
              email = :email LIMIT 1";
    $variables = array('email' => $email);

    //Execute Statement
    $results = $this->PDOExecute($sql, $variables);

    if(count($results) === 1){
      return $results[0];
    }else{
      return FALSE;
    }
  }

  public function registerUser($user){
    if(!isset(
      $user['email'],
      $user['password'],
      $user['company'],
      $user['firstname'],
      $user['lastname'],
      $user['role'],
      $user['phone'],
      $user['address'],
      $user['fips_code'],
      $user['legal'])
    ) return null;

    $variables = array(
      'email'     => $user['email'],
      'password'  => $this->salt($user['password']),
      'company'   => $user['company'],
      'firstname' => $user['firstname'],
      'lastname'  => $user['lastname'],
      'role'      => $user['role'],
      'phone'     => $user['phone'],
      'address'   => $user['address'],
      'fips_code' => $user['fips_code'],
      'legal'     => $user['legal'],
      'active'    => $user['role'] === 'bondsman' ? 'active' : 'inactive' //Bondsman are automatically activated
    );

    $sql = "insert into user (email, password, company, firstname, lastname, role, phone, address, county, legal, active)
            values (:email, :password, :company, :firstname, :lastname,
              (select id from role where name = :role), :phone, :address, (select id from county where fips_code = :fips_code), :legal,
              (select id from active_type where value = :active)
            )";

    $this->PDOExecute($sql, $variables);

    if($this->db->lastInsertId()){
      $this->runQueue();
      return TRUE;
    }else{
      return FALSE;
    }
  }

  public function updateUser($user){
    if(!isset($user['original_email'])) return null;

    $updates = array();
    $variables = array('original_email' => $user['original_email']);
    $passwordChanged = false;

    if(isset($user['email']) && $user['email'] !== null){
      $updates[] = "email = :email";
      $variables['email'] = $user['email'];
    }

    if(isset($user['password']) && $user['password'] !== null){
      $passwordChanged = true;
      if(!isset($user['passwordOld'])) return null;
      $updates[] = "password = :password";
      $variables['password'] = $this->salt($user['password']);
      $variables['passwordOld'] = $this->salt($user['passwordOld']);
    }

    if(isset($user['company']) && $user['company'] !== null){
      $updates[] = "company = :company";
      $variables['company'] = $user['company'];
    }

    if(isset($user['firstname']) && $user['firstname'] !== null){
      $updates[] = "firstname = :firstname";
      $variables['firstname'] = $user['firstname'];
    }

    if(isset($user['lastname']) && $user['lastname'] !== null){
      $updates[] = "lastname = :lastname";
      $variables['lastname'] = $user['lastname'];
    }

    if(isset($user['phone']) && $user['phone'] !== null){
      $updates[] = "phone = :phone";
      $variables['phone'] = $user['phone'];
    }

    if(isset($user['address']) && $user['address'] !== null){
      $updates[] = "address = :address";
      $variables['address'] = $user['address'];
    }

    if(isset($user['fips_code']) && $user['fips_code'] !== null){
      $updates[] = "county = (select id from county where fips_code = :fips_code)";
      $variables['fips_code'] = $user['fips_code'];
    }

    if(count($updates) === 0 ) return null;

    $sql = "update user set ".join(", ", $updates)." where email = :original_email";

    if($passwordChanged){
      $sql .= " and password = :passwordOld";
    }

    $result = $this->PDOExecute($sql, $variables);

    if($result === 1){
      $this->runQueue();
      return TRUE;
    }else{
      return FALSE;
    }
  }

  public function activateUser($email, $active){

    $sql = "update user set active = (select id from active_type where value = :active) where email = :email";

    $variables = array(
      'email' => $email,
      'active' => $active ? 'active' : 'inactive'
    );

    $this->PDOExecute($sql, $variables);
    $this->runQueue();
    return $active ? 'Account activated' : 'Account deactivated';
  }

  public function acknowledgePaypalIPN($payerId, $active){

    $sql = "update user set active = (select id from active_type where value = :active) where id = :id";

    $variables = array(
      'id' => $payerId,
      'active' => $active ? 'active' : 'inactive'
    );

    $this->PDOExecute($sql, $variables);
    $this->runQueue();
    return $active ? 'Account activated' : 'Account deactivated';
  }

  public function addReferral($referral, $email){
    if(!isset(
      $referral['booking_number'],
      $referral['firstname'],
      $referral['lastname'],
      $referral['offense_type'],
      $referral['charges'],
      $referral['jail'],
      $referral['amount'],
      $referral['bond_type'],
      $referral['address'],
      $referral['fips_code'])
    ) return null;

    //Add the referral, then check the status
    $variables = array(
        'booking_number'=> $referral['booking_number'],
        'firstname'     => $referral['firstname'],
        'lastname'      => $referral['lastname'],
        'offense_type'  => $referral['offense_type'],
        'charges'       => $referral['charges'],
        'jail'          => $referral['jail'],
        'amount'        => $referral['amount'],
        'bond_type'     => $referral['bond_type'],
        'address'       => $referral['address'],
        'fips_code'     => $referral['fips_code'],
        'referee_email' => $email
    );
    $sql = "insert into referral
          		(booking_number, firstname, lastname, offense_type, charges, jail, amount, bond_type, address, county, referred_by, status)
          	values
          		(:booking_number, :firstname, :lastname, :offense_type, :charges, :jail, :amount, :bond_type, :address,
          		(select id from county where fips_code = :fips_code),
          		(select id from user where email = :referee_email),
	            (select id from status_type where value = 'pending'))";

    $this->PDOExecute($sql, $variables);

    if($this->db->lastInsertId()){
      $this->runQueue();
      return true;
    }else{
      return false;
    }
  }

  public function updateReferral($id, $status){

    //Create Query
    $sql = "UPDATE referrals SET status = :status WHERE id = :id";
    $variables = array(
      'status' => $status,
      'id' => $id
    );

    //Execute Statement
    $rowsChanged = $this->PDOExecute($sql, $variables);
    if($rowsChanged === 1){
      $this->runQueue();
      return TRUE;
    }else{
      return null;
    }
  }

  function getSubmittedReferrals($email){
    $sql = "select
              r.id, r.booking_number, r.firstname, r.lastname, o.label as offense_type,
              r.charges, r.jail, r.amount, b.label as bond_type, r.address, c.name as county,
              s.name as state, if(r.accepted_by is null, false, true) accepted, st.name as status
            from
              referral r
              left join offense_type o on r.offense_type = o.id
              left join bond_type b on r.bond_type = b.id
              left join county c on r.county = c.id
              left join state s on c.state_id = s.id
              left join status_type st on r.status = st.id
            where
              referred_by = (select id from user where email = :email)
            order by
              id desc";
    $variables = array('email' => $email);

    return $this->PDOExecute($sql, $variables);
  }

  function getAssignedReferrals($email){
    $sql = "select
              q.id, r.booking_number, r.firstname, r.lastname, o.label as offense_type,
              r.charges, r.jail, r.amount, b.label as bond_type, r.address, c.name as county,
              s.name as state, unix_timestamp(q.updated_on) as accepted_epoch
            from
              referral r
              left join offense_type o on r.offense_type = o.id
              left join bond_type b on r.bond_type = b.id
              left join referral_queue q on r.id = q.referral_id
              left join county c on r.county = c.id
              left join state s on c.state_id = s.id
            where
              q.user_id = (select id from user where email = :email)
            and
              q.status = (select id from status_type where value = 'accepted')
            order by
              id desc";
    $variables = array('email' => $email);

    $results = $this->PDOExecute($sql, $variables);

    foreach($results as &$row){
      if(is_string($row['accepted_epoch'])) $row['accepted_epoch'] = (int)$row['accepted_epoch'] * 1000;
    }

    return $results;
  }

  function getOfferedReferrals($email){
    $this->runQueue();
    $sql = "select
              q.id, r.booking_number, r.firstname, r.lastname, o.label as offense_type,
              r.charges, r.jail, r.amount, b.label as bond_type, r.address,
              c.name as county, s.name as state, unix_timestamp(q.notified_on) as expires
            from
              referral r
              left join offense_type o on r.offense_type = o.id
              left join bond_type b on r.bond_type = b.id
              left join referral_queue q on r.id = q.referral_id
              left join county c on r.county = c.id
              left join state s on c.state_id = s.id
            where
              q.user_id = (select id from user where email = :email)
            and
              q.status = (select id from status_type where value = 'pending')
            order by
              id desc";
    $variables = array('email' => $email);

    $results = $this->PDOExecute($sql, $variables);

    foreach($results as &$row){
      if(is_string($row['expires'])) $row['expires'] = (int)$row['expires'] * 1000;
    }

    return $results;
  }

  function updateAssignedReferral($referral){
    if(!isset(
      $referral['id'],
      $referral['accept'])
    ) return null;

    $this->runQueue();

    $sql = "update
              referral_queue
            set
              status = (select id from status_type where value = :status)
            where
              id = :id
            and
              status = (select id from status_type where value = 'pending')";

    $variables = array(
      'id'      => $referral['id'],
      'status'  => $referral['accept'] === true ? 'accepted' : 'rejected'
    );

    $this->PDOExecute($sql, $variables);
    $this->runQueue();
    return TRUE;
  }

  public function getCounties(){
    $sql = "select
              c.fips_code, c.name as county, s.name as state, count(u.id) as num_of_bondsman
            from
              county c
              left join state s on c.state_id = s.id
              left join user u on u.county = c.id
            group by
              c.fips_code, c.name, s.name";

    $results = $this->PDOExecute($sql);

    foreach($results as &$row){
      if(is_string($row['num_of_bondsman'])) $row['num_of_bondsman'] = (int)$row['num_of_bondsman'];
    }

    if(count($results) > 0){
      return $results;
    }else{
      return null;
    }
  }

  public function getBondTypes(){
    $sql = "select
              id, label
            from
              bond_type";

    $results = $this->PDOExecute($sql);

    if(count($results) > 0){
      return $results;
    }else{
      return null;
    }
  }

  public function getOffenseTypes(){
    $sql = "select
              id, label
            from
              offense_type";

    $results = $this->PDOExecute($sql);

    if(count($results) > 0){
      return $results;
    }else{
      return null;
    }
  }

  public function requestResetPasswordViaMobile($json){
    if(!isset($json['email'])) return null;

    //generate a random 6 digit string
    $authcode = "";
    for ($i = 0; $i<6; $i++){
      $authcode .= mt_rand(0,9);
    }

    $sql = "insert into mobile_password_reset
              (user_id, authcode)
            values
              ((select id from user where email = :email), :authcode)";

    $variables = array(
      'email' => $json['email'],
      'authcode' => $authcode
    );

    $results = $this->PDOExecute($sql, $variables);

    if($results === 1){
      return true;
    }else{
      return false;
    }
  }

  public function resetPasswordViaMobile($json){
    if(!isset($json['password'], $json['authcode'])) return null;

    // After 60 minutes, the authkey expires
    $sql = "update user
            set password = :password
            where id = (
              select
                user_id
              from
                mobile_password_reset
              where
                authcode = :authcode
              and
                timestampdiff(minute, created_on, now()) < 15
            )";

    $variables = array(
      'password' => $this->salt($json['password']),
      'authcode' => $json['authcode']
    );

    $results = $this->PDOExecute($sql, $variables);

    if($results === 1){
      return true;
    }else{
      return false;
    }
  }

  public function verifySMSCode($email, $json){
    if(!isset($json['authcode'])) return null;

    $sql = "select
              user_id
            from
              mobile_password_reset
            where
              authcode = :authcode
            and
              timestampdiff(minute, created_on, now()) < 15";

      $variables = array(
        'authcode' => $json['authcode']
      );

      $results = $this->PDOExecute($sql, $variables);

      if(count($results) === 1){
        return true;
      }else{
        return false;
      }
  }

  public function requestResetPasswordViaEmail($json){
    if(!isset($json['email'])) return null;
    //generate a random string
    $authkey = bin2hex(random_bytes(30));

    $sql = "insert into email_password_reset
              (user_id, authkey)
            values
              ((select id from user where email = :email), :authkey)";

    $variables = array(
      'email' => $json['email'],
      'authkey' => $authkey
    );

    $results = $this->PDOExecute($sql, $variables);

    if($results === 1){
      return true;
    }else{
      return false;
    }
  }

  public function resetPasswordViaEmail($json){
    if(!isset($json['password'], $json['authkey'])) return null;

    // After 60 minutes, the authkey expires
    $sql = "update user
            set password = :password
            where id = (
              select
                user_id
              from
                email_password_reset
              where
                authkey = :authkey
              and
                timestampdiff(minute, created_on, now()) < 60
            )";

    $variables = array(
      'password' =>  $this->salt($json['password']),
      'authkey' => $json['authkey']
    );

    $results = $this->PDOExecute($sql, $variables);

    if($results === 1){
      return true;
    }else{
      return false;
    }
  }

    public function getUsage(){
      $sql = "select
              	u.lastname,
                u.created_on,
                u.company,
                u.email,
                r.name as role,
                c.name as county,
                s.name as state
              from
              	user u
                left join county c on u.county = c.id
                left join state s on c.state_id = s.id
                left join role r on u.role = r.id";

      return $this->PDOExecute($sql);

    }

  //---------------------------//
  //    PROTECTED METHODS      //
  //---------------------------//

  protected function runQueue(){
    return $this->PDOExecute("call run_queue(0)");
  }

  protected function salt($text){
    return $password = sha1("$this->salt1$this->salt2$text$this->salt3");
  }

  //This function executes queries
  protected function PDOExecute($sqlString, $variables = array(), $attempt = 0){
    try{
      $statement = $this->db->prepare($sqlString);

      //Insert variables as needed
      //DO NOT USE $val. It binds each placeholder to the same location
      //and will likely return no results.
      foreach ($variables as $key => $val){
        $statement->bindParam(':'.$key, $variables[$key]);
      }

      //Execute the query
      $statement->execute();

      //Check for errors.
      $errors = $statement->errorInfo();

      //If the error is a deadlock and there are fewer than 5 attempts, try again
      if($errors[0] === '40001' && $attempt < 10){
        sleep(rand(1*($attempt+1),3*($attempt+1)));
        return $this->PDOExecute($sqlString, $variables, ++$attempt);
      }

      //All other errors, or any more deadlocks, fail
      if(isset($errors[2])) return ifFails(null, 501, "(SQL STATE)". $errors[0]. " (MYSQL ERROR)".$errors[1]." (ERROR)".$errors[2]);

      //If no errors, return the result
      //If it's a select statement, return the rows
      if(stripos($sqlString, 'select') === 0){
        return $statement->fetchAll(PDO::FETCH_ASSOC);
      //Otherwise return the number of row's affected
      }else{
        return $statement->rowCount();
      }

    }catch(PDOException $e){
      return null;
    }
  }
}
?>
