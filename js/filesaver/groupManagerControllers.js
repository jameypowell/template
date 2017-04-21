app.controller('TimeOutCtrl', function($scope,$window){
      $scope.started = true;
      $scope.logoutAlert = false;

      $scope.events = [];

    $scope.$on('IdleStart', function() {
        // the user appears to have gone idle
    });

    $scope.$on('IdleWarn', function(e, countdown) {

        $scope.logoutAlert = true;
    });

    $scope.$on('IdleTimeout', function() {

       $window.location.href = "/resources/portalLogout.php";
    });

    $scope.$on('IdleEnd', function() {

        $scope.logoutAlert = false;
    });

    $scope.$on('Keepalive', function() {
        //console.log("Keepalive called");
    });

    });


/**************** GET GROUPS USER IS MEMBER OF ***************/
app.controller('getGroupsController', function($scope, $http, $q, getUserMemberOfGroupService, $rootScope, $location, $timeout, Notification ) {
	$scope.splitView=false;

	if($scope.groups === undefined || $scope.groups ===null)
	{

		var promise = getUserMemberOfGroupService.getGroups();
		promise.then(function(response){
			$scope.groups = response.data;

		});
	}
	$scope.getGroupName = function(group){
		//console.log(group);
		$scope.splitView=true;
		$rootScope.groupName=group.sAMAccountName;
	};
	$rootScope.showThis = function( showVar , time ){
		//console.log(showVar);
		$timeout(function(){
			showVar = true; //console.log(showVar);
		} , time  );

	}
	$scope.isActive = function (path) {
		if ($location.path().substr(0, path.length) === path) {
			this.activeGroup=null;
			return true;
		} else {
			return false;
		}
	}
$scope.feedbackMail = "mailto: iam-portal-feedback@adobe.com" + "?subject=IAM Portal Feedback";

});
//********************Get a group's details***************************
app.controller('getGroupDetailsController', function($scope, $http, $q, getGroupDetailsService,updateGroupService,$rootScope, Notification,$route,$templateCache) {
	var groupName;
	var selectedGroup;
	$rootScope.$watch("groupName", function(){
		//console.log(arguments);
		if(angular.isUndefined($rootScope.groupName)||groupName===$rootScope.groupName){return;}
		groupName = $rootScope.groupName;

		//console.log("fetching : "+groupName);
		var promise = getGroupDetailsService.getGroupDetails(encodeURIComponent($rootScope.groupName));
		promise.then(function(response){
			$scope.groupDetails = response.data;
			var tempOwners = response.data.AdobeGroupManager;
			$scope.groupOwner=[];
			for(i in tempOwners)
				$scope.groupOwner.push(tempOwners[i].substring(0,tempOwners[i].indexOf(";")));



		});
	})
	$scope.openModalAddMembers = function(){
		//console.log('openModalAddMembers');
		$scope.showModalAddMember = true;
	}
	$scope.focusfield = true;
	$scope.showNotification = function(){
		//console.log('getGroupDetailsController notification');
		Notification.light('6 members have been successfully added!');
	}
	$scope.unsubscribe = function(grpName)
	{

		$scope.showModalConfirmation = !$scope.showModalConfirmation;
		selectedGroup = grpName;
	}
	$scope.unsubscribeConfirm = function(){
		selectedGroup = groupName;
		var dataObject = {
			group : encodeURIComponent(selectedGroup),
			operType : "unsubscribe"
		};

		var promise = updateGroupService.updateGroup(dataObject);
		promise.then(function(response){
			var result = response.data;
			//console.log(result);


			if(result.unsubscribe=="OK")
				Notification.success('You have successfully unsubscribed to '+selectedGroup);
			else
				Notification.error('Unsubscribe failed '+result.subscribe);


		});

		$scope.showModalConfirmation = false;

		var currentPageTemplate = $route.current.templateUrl;
		$templateCache.remove(currentPageTemplate);
		$route.reload();

	}


});
/**************** GET A GROUP'S MEMBERS ***************/
app.controller('getGroupMembersController', function($scope, $http, $q, getGroupMembersService, $rootScope, Notification) {
	var groupName;
	$rootScope.$watch("groupName", function(){
		if(angular.isUndefined($rootScope.groupName)||groupName===$rootScope.groupName){return;}
		groupName = $rootScope.groupName;
		var promise = getGroupMembersService.getGroupMembers(encodeURIComponent($rootScope.groupName));
		promise.then(function(response){
			$scope.groupMembers = response.data;
		});
	})
	$scope.focusfield = true;
	$scope.showNotification = function(){
		//console.log('getGroupMembersController notification');
		Notification.primary('Primary notification');
	}
});
/**************** GET GROUPS USER OWNS ***************/
app.controller('getGroupsOwnedController', function($scope, $http, $q, getUserOwnedGroupsService, $rootScope, $location, $timeout) {
	$scope.splitView=false;
	var promise = getUserOwnedGroupsService.getGroups();
	promise.then(function(response){
		$scope.groups = response.data;

	});
	$scope.getGroupOwnedName = function(group){
		//console.log(group);
		$scope.splitView=true;
		$rootScope.groupOwnedName=group.sAMAccountName;
	};
	$rootScope.showThis = function( showVar , time ){
		//console.log(showVar);
		$timeout(function(){
			showVar = true; //console.log(showVar);
		} , time  );


	}
	$scope.isActive = function (path) {
		if ($location.path().substr(0, path.length) === path) {
			this.activeGroup = null;
			return true;
		} else {
			return false;
		}
	}
});
/**************** GET OWNED GROUP'S DETAILS ***************/
app.controller('getGroupOwnedDetailsController', function($scope, $http,$location,$q,getGroupDetailsService,deleteOwnedGroupService, $rootScope,Notification ,$route,$templateCache) {
	var groupOwnedName;
	var selectedGroup = null;
	$rootScope.$watch("groupOwnedName", function(){
		//console.log(arguments);
		if(angular.isUndefined($rootScope.groupOwnedName)||groupOwnedName===$rootScope.groupOwnedName){return;}
		groupOwnedName = $rootScope.groupOwnedName;
		//console.log("fetching : "+$rootScope.groupOwnedName);
		var promise = getGroupDetailsService.getGroupDetails(encodeURIComponent($rootScope.groupOwnedName));
		promise.then(function(response){
			$scope.groupDetails = response.data;
			var tempOwners = response.data.AdobeGroupManager;
			$scope.groupOwner=[];
			for(i in tempOwners)
				$scope.groupOwner.push(tempOwners[i].substring(0,tempOwners[i].indexOf(";")));

			//console.log($scope.groupOwner);

		});
	})
	$scope.routeToGroupEdit = function(groupName){

		//console.log("redirecting groupName : "+groupName);

		$location.path("/groupEdit").search('groupName', groupName);


	}
	$scope.deleteGroup = function(groupName)
	{
		$scope.showDeleteConfirmation = !$scope.showDeleteConfirmation;
		selectedGroup = groupName;
	}
	$scope.deleteConfirm = function()
	{
		var promise = deleteOwnedGroupService.deleteOwnedGroup(encodeURIComponent(selectedGroup));
		promise.then(function(response){
			var result = response.data;
			//console.log(result);
			//console.log(result.result);
			if(result.result=="\"OK\"")
				Notification.success('Group '+selectedGroup+' deleted');
			else
				Notification.error('Group deletion failed '+result.result);

		});

		$scope.showDeleteConfirmation = false;

		var currentPageTemplate = $route.current.templateUrl;
		$templateCache.remove(currentPageTemplate);
		$route.reload();
	}

});
/**************** GET A OWNED GROUP'S MEMBERS ***************/
app.controller('getGroupOwnedMembersController', function($scope, $http, $q, getGroupMembersService, $rootScope) {
	var groupOwnedName;
	$rootScope.$watch("groupOwnedName", function(){
		if(angular.isUndefined($rootScope.groupOwnedName)||groupOwnedName===$rootScope.groupOwnedName){return;}
		groupOwnedName = $rootScope.groupOwnedName;
		var promise = getGroupMembersService.getGroupMembers(encodeURIComponent($rootScope.groupOwnedName));
		promise.then(function(response){
			$scope.groupMembers = response.data;
		});
	})
});

/**************** GET GROUPS USER CAN SUBSCRIBE TO ***************/

app.controller('getSubscribeGroupsController', function($scope, $http, $q, getSubscribeGroupsService,updateGroupService,getUserMemberOfGroupService, $rootScope, $location, $timeout, Notification,$route,$templateCache ) {

	var selectedGroup = null;
	var userGroups = null;

	var promise = getUserMemberOfGroupService.getGroups();
	promise.then(function(response){
		userGroups = response.data;

	});

	$scope.searchKeyDown = function(q){

		$scope.showAddResults = true;
		var resultLimit  = 18;
		if(q.length>5)
			resultLimit = 50;

		var promise = getSubscribeGroupsService.getGroups(q,resultLimit);
		promise.then(function(response){
			var searchResults = response.data;

			var validGroups = [];

			for(i in searchResults) {
				var isMember = false;
				for(j in userGroups){

					if(userGroups[j]["sAMAccountName"].toUpperCase() == searchResults[i]["groupname"].toUpperCase()) {
						isMember = true;
						break;
					}
				}
				if(!isMember)
					validGroups.push(searchResults[i]);

			}

			$scope.groups = validGroups;

		});

	}

	$scope.getGroupName = function(group){
		//console.log(group);
		$rootScope.groupName=group.sAMAccountName;
	};
	$rootScope.showThis = function( showVar , time )
	{
		//console.log(showVar);
		$timeout(function()
		{
			showVar = true; //console.log(showVar);
		}
		, time  );
	}
	$scope.subscribe = function(groupName)
	{
		$scope.showSubscribeConfirmation = !$scope.showSubscribeConfirmation;
		selectedGroup = groupName;
	}
	$scope.subscribeConfirm = function()
	{

		var dataObject = {
			group : encodeURIComponent(selectedGroup),
			operType : "subscribe"
		};
		var promise = updateGroupService.updateGroup(dataObject);
		promise.then(function(response){
			var result = response.data;
			//console.log(result);
			//console.log(result.subscribe);
			if(result.subscribe == "OK")
				Notification.success('You have successfully subscribed to '+selectedGroup);
			else
				Notification.error('Group subscription failed '+result.subscribe);

		});

		$scope.showSubscribeConfirmation = false;

		var currentPageTemplate = $route.current.templateUrl;
		$templateCache.remove(currentPageTemplate);
		$route.reload();

	}
});


/**************** create group Controller ***************/

app.controller('getGroupCreateController', function($scope, $http, $q,getGroupDetailsService,getGroupMembersService,getAllUsersService,createGroupService,$rootScope, Notification,$filter,$route,$templateCache) {
	var groupName;
	var groupMembers = [];
	$scope.selectedUsers=[];
	$scope.grp=[];

	$scope.availableOwners = [];
	$scope.grp.grpOwners = [];

	$scope.grp.grpName="";
	$scope.grp.mailNeeded = false;
	$scope.grp.approvalRequired = true;
	$scope.grp.isSecure = true;
	$scope.grp.externalAccess = false;


	$scope.validateGroupName = function(){

		if($scope.grp.grpName!==null && $scope.grp.grpName.length==4)
		{
			$scope.grp.grpName = "";
			$scope.grp.email = "";
		}
		if($scope.grp.grpName!==null && $scope.grp.grpName.split("-")[0]!=="Grp") //fix for IE issue
			$scope.grp.grpName = "Grp-"+$scope.grp.grpName;
		if($scope.grp.grpName!==null && $scope.grp.grpName.length>4)
		{
			var e = $scope.grp.grpName;
			e = e.replace(/\s+/g, '');
			$scope.grp.email=e+"@adobe.com";
		}

	}

	$scope.findOwner = function(q){

		$scope.availableOwners =[];
		var promise = getAllUsersService.getAllUsers(q,10);
		promise.then(function(response){
			var ownerResults = response.data;

			for(i in ownerResults)
			{
				$scope.availableOwners.push(ownerResults[i]["userid"]+"("+ownerResults[i]["displayname"]+")");

			}

		});

	}

	$scope.openModalAddMembers = function(){
		//console.log("openModalAddMembers");
		$scope.showModalAddMember = true;
	}


	$scope.showNotification = function(){
		//console.log('getGroupDetailsController notification');
		Notification.light('6 members have been successfully added!');
	}

	$scope.searchKeyDown = function(q){

		$scope.showAddResults = true;
		var promise = getAllUsersService.getAllUsers(q,18);
		promise.then(function(response){
			$scope.fullUserListing = response.data;
		});

	}

	$scope.addSelectedMembers = function(){

		$scope.showModalAddMember = false;
		$scope.fullUserListing=[];
		$scope.showAddResults = false;
	}



	$scope.addSelectedUsers = function (member) {

		member.selected = !member.selected;

		if(member.selected)
		{
			var alreadyAdded = false;
			for(i in groupMembers) {
				if(groupMembers[i]["userid"] == member.userid) {
					alreadyAdded=true;
					break;
				}
			}
			if(!alreadyAdded)
				groupMembers.push({
					"userid":member.userid,
					"displayname":member.displayname
				});

		}
		else
		{
			var i;
			var localGrps = [];
			for(i in groupMembers) {
				if(groupMembers[i]["userid"] != member.userid) {
					localGrps.push(groupMembers[i]);

				}
			}
			groupMembers = localGrps;

		}
		$scope.selectedUsers = groupMembers;
		$scope.grp.search="";

	}

	$scope.deleteSelectedMembers = function(userid){

		var tempMembers = [];


		for(i in $scope.selectedUsers) {
			if($scope.selectedUsers[i]["userid"] != userid) {
				tempMembers.push($scope.selectedUsers[i]);
			}
		}

		$scope.selectedUsers = tempMembers;
		groupMembers = tempMembers;


	}

	$scope.createGroup = function(){

		//console.log("openModalAddGroup");
		var owners = $scope.grp.grpOwners;
		var ownerString="";
		for(i in owners)
		{
			ownerString+=owners[i]["userid"];
				if(i<owners.length-1)
					ownerString+=";";
			}
			//console.log(ownerString);
			if(ownerString=="")
			{
				Notification.error("Secondary Owner required");
				return;
			}
			if($scope.grp.grpDesc==null || $scope.grp.grpDesc.trim()=="")
			{
				Notification.error("Description is required");
				return;
			}

			var users = null;
			if($scope.grp.bulkLoadOption)
				users = encodeURIComponent($scope.grp.grpBulkUsers);
			else
				users = $scope.selectedUsers;
			//console.log(users);

			var dataObject = {
				group : encodeURIComponent($scope.grp.grpName),
				owners : ownerString,
				mail : $scope.grp.email,
				tags : $scope.grp.tags,
				approvalRequired : $scope.grp.approvalRequired,
				isSecure : $scope.grp.isSecure,
				externalAccess : $scope.grp.externalAccess,
				description : encodeURIComponent($scope.grp.grpDesc),
				users : users,
				bulkload : $scope.grp.bulkLoadOption

			};

			var promise = createGroupService.createGroup(dataObject);
			promise.then(function(response){
				var result = response.data;
				//console.log(dataObject);
				//console.log(result);
				if(result.groupCreate=="OK" && result.groupAddOwners=="OK" && result.groupAddUsers=="OK")
				{
					Notification.success("Group Created Successfully");
					var currentPageTemplate = $route.current.templateUrl;
					$templateCache.remove(currentPageTemplate);
					$route.reload();
				}
				else
				{
					var errorMsg = "Group creation failed";
					if(result.groupCreate !==undefined && result.groupCreate !== null)
						errorMsg +=" : "+result.groupCreate;
					if(result.groupAddOwners !==undefined && result.groupAddOwners !== null)
						//console.log("adding owners to new group : "+result.groupAddOwners);
					if(result.groupAddUsers !==undefined && result.groupAddUsers !== null)
						//console.log("adding users to new group : "+result.groupAddUsers);

					Notification.error(errorMsg);

				}

			});
		}
	});
/**************** create group Controller ends here***************/


/**************** edit group controllre starts here **************/
app.controller('getGroupEditController', function($scope, $http, $q,$location,getGroupDetailsService,getGroupMembersService,getAllUsersService,updateGroupService,$rootScope, Notification,$filter,$route,$templateCache) {

	$scope.selectedUsers=[];
	$scope.grp=[];

	$scope.availableOwners = [];
	$scope.grp.grpOwners = [];

	$scope.grp.grpName="";


	var groupName;

	var origOwners = [];
	var origUsers = [];




	var editGroup = $location.search().groupName;
	var promise = getGroupDetailsService.getGroupDetails(encodeURIComponent(editGroup));
	promise.then(function(response){

		$scope.grp.grpName = response.data.sAMAccountName;
		$scope.grp.grpExpDate = Date.parse(response.data.expirationTime);
		$scope.grp.email = response.data.mail;
		$scope.grp.grpDesc = response.data.description;
		$scope.grp.approvalRequired = response.data.AdobeGMApprovalRequired;

		if(response.data.dLMemSubmitPerms=="CN=Exchange-Internal,OU=Location_Based_DLs,OU=Exchange_Objects,DC=adobenet,DC=global,DC=adobe,DC=com")
			$scope.grp.externalAccess = false;
		else
			$scope.grp.externalAccess = true;

		var tempOwners = response.data.AdobeGroupManager;

		for(i in tempOwners)
		{
			$scope.grp.grpOwners.push({"userid":tempOwners[i].substring(tempOwners[i].indexOf(";")+1),"name":tempOwners[i].substring(0,tempOwners[i].indexOf(";"))});
			origOwners.push(tempOwners[i].substring(tempOwners[i].indexOf(";")+1));

		}
	});

	promise = getGroupMembersService.getGroupMembers(encodeURIComponent(editGroup));
	promise.then(function(response){
		var currentUsers = response.data;
		var mems = [];
		for(i in currentUsers)
		{
			if(currentUsers[i]["sAMAccountName"]===null)
			{
				mems.push({
                                        "userid":currentUsers[i]["givenName"],
                                        "displayname":currentUsers[i]["givenName"]
                                });
                                origUsers.push({
                                        "userid":currentUsers[i]["givenName"],
                                        "displayname":currentUsers[i]["givenName"]
                                });
			}
			else
			{
				mems.push({
					"userid":currentUsers[i]["sAMAccountName"],
					"displayname":currentUsers[i]["givenName"]+" "+currentUsers[i]["sn"]
				});
				origUsers.push({
					"userid":currentUsers[i]["sAMAccountName"],
					"displayname":currentUsers[i]["givenName"]+" "+currentUsers[i]["sn"]
				});
			}

		}
		$scope.selectedUsers = mems;


	});


	$scope.openModalAddMembers = function(){
		//console.log("openModalAddMembers");
		$scope.showModalAddMember = true;
	}


	$scope.showNotification = function(){
		//console.log('getGroupDetailsController notification');
		Notification.light('6 members have been successfully added!');
	}

	$scope.searchKeyDown = function(q){

		$scope.showAddResults = true;
		var promise = getAllUsersService.getAllUsers(q,18);
		promise.then(function(response){
			$scope.fullUserListing = response.data;
		});

	}

	$scope.addSelectedMembers = function(){

		$scope.showModalAddMember = false;
		$scope.fullUserListing=[];
		$scope.showAddResults = false;
	}



	$scope.addSelectedUsers = function (member) {
		member.selected = !member.selected;
		var tempMembers = 	$scope.selectedUsers;
		if(member.selected)
		{
			var alreadyAdded = false;

			for(i in tempMembers) {
				if(tempMembers[i]["userid"] == member.userid) {
					alreadyAdded=true;
					break;
				}
			}
			if(!alreadyAdded)
				tempMembers.push({
					"userid":member.userid,
					"displayname":member.displayname
				});

		}
		else
		{
			var i;
			var localGrps = [];
			for(i in tempMembers) {
				if(tempMembers[i]["userid"] != member.userid) {
					localGrps.push(tempMembers[i]);

				}
			}
			grouptempMembersMembers = localGrps;

		}
		$scope.selectedUsers =  tempMembers;
		$scope.grp.search="";

	}

	$scope.deleteSelectedMembers = function(userid){

		var tempMembers = [];


		for(i in $scope.selectedUsers) {
			if($scope.selectedUsers[i]["userid"] != userid) {
				tempMembers.push($scope.selectedUsers[i]);
			}
		}
		$scope.selectedUsers = tempMembers;

	}


	$scope.findOwner = function(q){

		$scope.availableOwners =[];
		var promise = getAllUsersService.getAllUsers(q,10);
		promise.then(function(response){
			var ownerResults = response.data;

			for(i in ownerResults)
			{
				$scope.availableOwners.push(ownerResults[i]["userid"]+"("+ownerResults[i]["displayname"]+")");

			}

		});

	}
	$scope.toOwner = function(){
		$location.path("/groupOwner");
	}

	$scope.updateGroup = function(grpName){

		//console.log("In updateGroup : "+grpName);
		var owners = $scope.grp.grpOwners;
		var users = $scope.selectedUsers;
		var addOwnerString="";
		var removeOwnerString="";
		var addUserString="";
		var removeUserString="";


		for(i in owners)
		{
			var ts =owners[i]["userid"];
				var exists = false;
				for(j in origOwners )
				{
					if(ts==origOwners[j])
					{
						exists = true;
						break;
					}

				}
				if(!exists)
				{
					if(addOwnerString.length == 0)
						addOwnerString += ts;
					else
						addOwnerString += ";"+ts;
				}

			}
			for(i in origOwners)
			{

				var exists = false;
				for(j in owners )
				{
					var ts =owners[j]["userid"];
						if(origOwners[i]==ts)
						{
							exists = true;
							break;
						}

					}
					if(!exists)
					{
						if(removeOwnerString.length == 0)
							removeOwnerString += origOwners[i];
						else
							removeOwnerString += ";"+origOwners[i];
					}
				}
				var origOwnerString = "";
				for(i in origOwners)
					origOwnerString+=origOwners[i]+";";

				if($scope.grp.bulkLoadOption)
					addUserString = encodeURIComponent($scope.grp.grpBulkUsers);
				else
				{
					for(i in users)
					{
						var exists = false;
						for(j in origUsers )
						{
							if(users[i]["userid"]==origUsers[j]["userid"])
							{
								exists = true;
								break;
							}

						}
						if(!exists)
						{
							if(addUserString.length == 0)
								addUserString += users[i]["userid"];
							else
								addUserString += ";"+users[i]["userid"];
						}

					}

					for(i in origUsers)
					{
						var exists = false;
						for(j in users )
						{
							if(origUsers[i]["userid"]==users[j]["userid"])
							{
								exists = true;
								break;
							}

						}
						if(!exists)
						{
							if(removeUserString.length == 0)
								removeUserString += origUsers[i]["userid"];
							else
								removeUserString += ";"+origUsers[i]["userid"];
						}

					}
				}
				//following block of code forces one year group expiry. Will be enforced later
				/*var eDateString = "";
				if($scope.grp.grpExpDate != null)
				{
					eDate = new Date($scope.grp.grpExpDate);
					var today = new Date();
					var todayString = (today.getMonth()+1)+"/"+today.getDate()+"/"+today.getFullYear();
					eDateString = (eDate.getMonth()+1)+"/"+eDate.getDate()+"/"+eDate.getFullYear();

					if( todayString !=eDateString && eDate < today )
					{
						Notification.error("Invalid Expiry date");
						return false;
					}
					if(eDate > today.setFullYear(today.getFullYear()+1))
					{
						Notification.error("Expiry date cannot be greater than a year");
						return false;
					}

				}*/
				var dataObject = {
					group : encodeURIComponent($scope.grp.grpName),
					addUserString : addUserString,
					removeUserString : removeUserString,
					addOwnerString : addOwnerString,
					removeOwnerString : removeOwnerString,
					approvalRequired : $scope.grp.approvalRequired,
					externalAccess : $scope.grp.externalAccess,
					groupClosed : $scope.grp.groupClosed,
					description : encodeURIComponent($scope.grp.grpDesc),
					//expiration : encodeURIComponent(eDateString),
					managedBy : origOwnerString,
					operType : "updateGroup"

				};

				var promise = updateGroupService.updateGroup(dataObject);
				promise.then(function(response){
					var result = response.data;
					//console.log(result);
					if(result.groupUpdate=="OK" && result.removeUsers=="OK" && result.addUsers=="OK" && result.removeOwners=="OK" && result.addOwners=="OK")
					{
						Notification.success("Group Modified");
						var currentPageTemplate = $route.current.templateUrl;
						$templateCache.remove(currentPageTemplate);
						$location.path("/groupOwner");
					}
					else
					{
						//console.log("Group info : "+result.groupUpdate +"; Remove users : "+result.removeUsers+"; Add users : "+result.addUsers+"; Remove Owners : "+result.removeOwners+"; Add owners : "+result.addOwners);
						var errMsg = "Group update failed : ";
						if(result.groupUpdate !="OK")
							errMsg += result.groupUpdate+",";
						if(result.removeUsers !="OK")
							errMsg += result.removeUsers+",";
						if(result.addUsers !="OK")
							errMsg += result.addUsers+",";
						if(result.removeOwners !="OK")
							errMsg += result.removeOwners+",";
						if(result.addOwners !="OK")
							errMsg += result.addOwners+",";

						Notification.error(errMsg);
					}
				});

			}

				//datepicker functions
				$scope.clear = function() {
					$scope.grp.grpExpDate = null;
				};

				$scope.inlineOptions = {
					customClass: getDayClass,
					minDate: new Date(),
					showWeeks: true
				};
				var maxDate = new Date();
				maxDate.setFullYear(maxDate.getFullYear() + 1);
				$scope.dateOptions = {
					formatYear: 'yy',
					maxDate: maxDate,
					minDate: new Date(),
					startingDay: 1
				};

				$scope.open1 = function() {
					//console.log("trying to open date popup");
					$scope.popup1.opened = true;
				};

				$scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'MM/dd/yyyy', 'shortDate'];
				$scope.format = $scope.formats[2];
				$scope.altInputFormats = ['M!/d!/yyyy'];

				$scope.popup1 = {
					opened: false
				};

				function getDayClass(data) {
					var date = data.date,
					mode = data.mode;
					if (mode === 'day') {
						var dayToCheck = new Date(date).setHours(0,0,0,0);

						for (var i = 0; i < $scope.events.length; i++) {
							var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

							if (dayToCheck === currentDay) {
								return $scope.events[i].status;
							}
						}
					}

					return '';
				}

			});


/**************** GET PENDING APPROVALS ***************/

app.controller('getPendingApprovalsController', function($scope, $http, $q, approveRequestService,approvalsPoller, $rootScope, $location, $timeout, Notification) {
	$scope.approvals = approvalsPoller.data;
	//console.log("approvallsit "+$scope.approvals.resp);
	var oldAlertCount=0;

	var denyRequestGroup = null;
	var denyRequestId = null;

	$scope.displayAlertCount = function(alertCount){
		if(alertCount > oldAlertCount)
		{
			Notification.warning("You have a new action item");
			oldAlertCount = alertCount;
		}
		else if(alertCount < oldAlertCount)
			oldAlertCount = alertCount;

		return alertCount;

	}

	$scope.showDenyModal=function(GroupName,RequestID){
		denyRequestGroup = GroupName;
		denyRequestId = RequestID;
		$scope.showModalDenyRequest = true;
	}

	$scope.denyAccess = function(Reason){
		var dataObject =
		{
			requestid : denyRequestId.toString(),
			action : "deny",
			reason : encodeURIComponent(Reason)
		};
		//console.log('dataObject: '+ dataObject);
		var promise = approveRequestService.approveRequest(dataObject);
		promise.then(function(response)
		{
			var result = response.data;
			//console.log('response' + result);
			if(result == "OK" || result=="\"OK\"")
				Notification.success('You have successfully denied access to ' + denyRequestGroup);
			else
				Notification.error('Group deny failed '+result);

			$scope.showModalDenyRequest = false;
		});


	}
	$scope.approveAccess = function(GroupName,RequestID){
					//Notification.light('You have successfully approved access to ' + GroupName);
					//console.log("in approve access");
					$scope.showDenyAccess = false;
					approvedGroup = GroupName;
					requestid = RequestID;
					//console.log('requestid '+ requestid);
					var dataObject =
					{
						requestid : requestid.toString(),
						action : "approve",
						reason : "approved"
					};
					var promise = approveRequestService.approveRequest(dataObject);
					promise.then(function(response)
					{
						var result = response.data;
						//console.log('response' + result);
								 //console.log(result.approveAccess);
								 if(result == "OK" || result=="\"OK\"")
								 	Notification.success('You have successfully approved access to ' + GroupName);
								 else
								 	Notification.error('Group approval failed '+result);

								});
				}

				$scope.routeToGroupAccessRequests = function(){
					$location.path("/groupAccessRequests");
				}

				$scope.convertToDate = function(dateObj){
					dateObj = dateObj.substring(dateObj.indexOf("(")+1,dateObj.indexOf(")"));
					eDate = new Date(parseFloat(dateObj));
					eDate = (eDate.getMonth()+1)+"/"+eDate.getDate()+"/"+eDate.getFullYear();
					return eDate;
				}

			});

/****owner directive starts here***/
app.filter('propsFilter', function() {
	return function(items, props) {
		var out = [];

		if (angular.isArray(items)) {
			var keys = Object.keys(props);

			items.forEach(function(item) {
				var itemMatches = false;

				for (var i = 0; i < keys.length; i++) {
					var prop = keys[i];
					var text = props[prop].toLowerCase();

					if (item[prop] != null && item[prop].toString().toLowerCase().indexOf(text) !== -1) {
						itemMatches = true;
						break;
					}
				}

				if (itemMatches) {
					out.push(item);
				}
			});
		} else {
			// Let the output be the input untouched
			out = items;
		}

		return out;
	};
});

app.controller('ownerCtrl', function ($scope, $http,getAllUsersService, $timeout, $interval) {
	var vm = this;
	var query = null;

	vm.disabled = undefined;
	vm.searchEnabled = undefined;
	$scope.grp.grpOwners=[];
	vm.availableOwners = [];
	$scope.findOwner = function(q){

		if(query==null || query != q)
		{

			var promise = getAllUsersService.getAllUsers(q,10);
			promise.then(function(response){
			var ownerResults = response.data;

			for(i in ownerResults)
				{
					var exists =false;
					for(j in vm.availableOwners )
						{
							if(vm.availableOwners[j]["userid"]==ownerResults[i]["userid"])
							{
								exists = true;
								break;
							}

						}
					if(!exists)
						vm.availableOwners.push({"userid":ownerResults[i]["userid"],"name":ownerResults[i]["displayname"]});

				}

			});
		}
		query = q;
	}



});
