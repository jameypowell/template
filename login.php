<?php
session_start();
error_reporting(0);

$userinfo = array(
                'kya'=>'supersecret',
                'user2'=>'password2'
                );

if(isset($_GET['logout'])) {
    $_SESSION['username'] = '';
    header('Location:  ' . $_SERVER['PHP_SELF']);
}

if(isset($_POST['username'])) {
    if($userinfo[$_POST['username']] == $_POST['password']) {
        $_SESSION['username'] = $_POST['username'];
    }else {
        echo "Invalid Login";
    }
}
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Login</title>
    </head>
    <body>
      <?php if(!isset($_SESSION['username'])){ ?>
        <form name="login" action="" method="post">
            Username:  <input type="text" name="username" value="" /><br />
            Password:  <input type="password" name="password" value="" /><br />
            <input type="submit" name="submit" value="Submit" />
        </form>
      <?php }?>
        <?php if(isset($_SESSION['username']) && !empty($_SESSION['username'])){ ?>
            <p>You are logged in as <?=$_SESSION['username']?></p>
            <?php
        $submittedValue = "images/kya.jpg";
        GLOBAL $submittedValue;
        $value0 = "";
        $value1 = "images/jp_slack.jpg";
        $value2 = "Apple";
        $value3 = "Orange";
        if (isset($_POST["FruitList"])) {
            $submittedValue = $_POST["FruitList"];
        }
        ?>
        <form action="" name="fruits" method="post">
        <select project="FruitList" id="FruitList" name="FruitList">
         <option value = "<?php echo $value0; ?>"<?php echo ($value0 == $submittedValue)?" SELECTED":""?>><?php echo $value0; ?></option>
         <option value = "<?php echo $value1; ?>"<?php echo ($value0 == $submittedValue)?" SELECTED":""?>>Jamey</option>
         <option value = "<?php echo $value2; ?>"<?php echo ($value0 == $submittedValue)?" SELECTED":""?>><?php echo $value2; ?></option>
         <option value = "<?php echo $value3; ?>"<?php echo ($value0 == $submittedValue)?" SELECTED":""?>><?php echo $value3; ?></option>
        </select>
        <input type="submit" name="submit" id="submit" value="Submit" />
        </form>
        <p>Image set to:  <?php echo $submittedValue; ?></p>

            <p><a href="logout.php">Logout</a></p>
        <?php }?>
    </body>
</html>
