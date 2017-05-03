/*app.service("api", function($http, $q){

	function execute(type, method, dataObject){
		return new $q(function(resolve, reject){
			$http[type]('api/1.0/'+method+'.json', dataObject).then(function(response){
				var json = response.data;
				if(json.status === 'success'){
					resolve(json.data[method]);
				}else{
					reject();
				}
			},function(errObj){
				console.error('API call failed');
				console.log(arguments);
				reject(errObj);
			});
		});
	};

	this.get = function(method, dataObject){
		return execute('get', method, {params:dataObject});
	};

	this.post = function(method, dataObject){
		return execute('post', method, dataObject);
	};

	this.put = function(method, dataObject){
		return execute('put', method, dataObject);
	};

	this.delete = function(method, dataObject){
		return execute('delete', method, {params:dataObject});
	};
});

/**************** USER LOGIN ***************/
//This service does not require to be logged in
/*app.service("sessionService", function(api){

	this.loggedIn = function(){
		return api.get('login');
	};

	this.login = function(dataObject){
		return api.post('login', dataObject);
	};

	this.logout = function(){
		return api.delete('login');
	};
});

/********** FORGOT PASSWORD LOGIN *************/
//This service does not require to be logged in
/*app.service("resetPasswordService", function(api){

	this.requestResetViaMobile = function(dataObject){
		return api.post('reset/password/mobile', dataObject);
	};

	this.requestResetViaEmail = function(dataObject){
		return api.post('reset/password/email', dataObject);
	};

	this.resetViaMobile = function(dataObject){
		return api.put('reset/password/mobile', dataObject);
	};

	this.resetViaEmail = function(dataObject){
		return api.put('reset/password/email', dataObject);
	};
});

/**************** DROPDOWN SERVICE ***************/
/*app.service("dropdownService", function(api, $q){

	this.getCounties = function(){
		return $q(function(resolve, reject){
			api.get('counties').then(function(counties){
				var countyArr = {},
						stateArr = [];
				for(var i=0; i<counties.length; i++){
					if(!(counties[i].state in countyArr)){
						countyArr[counties[i].state] = [];
					}
					countyArr[counties[i].state].push({
						fips_code				: counties[i].fips_code,
						label						: counties[i].county,
						num_of_bondsman : counties[i].num_of_bondsman
					});
				}
				for(var state in countyArr){
					stateArr.push(state);
				}
				resolve({counties:countyArr, states:stateArr});
			},reject);
		});
	};

	this.getBondTypes = function(){
		return api.get('bond/types');
	};

	this.getOffenseTypes = function(){
		return api.get('offense/types');
	};
});

/**************** USER REGISTRATION INFO ***************/
/*app.service("registerService", function(api){
  //This method does not require to be logged in
	this.registerUser = function(dataObject){
		return api.post('register/user', dataObject);
	};

	this.updateUser = function(dataObject){
		return api.put('user', dataObject);
	};

  this.activateViaSMS = function(dataObject){
    return api.post('activationcode', dataObject);
  }
});
/**************** REFERRAL SERVICE ***************/
//Every call in this service requires the user to be logged in
/*app.service("referralService", function(api){

	this.getSubmittedReferrals = function(){
		return api.get('submit/referral');
	};

	this.submitReferral = function(dataObject){
		return api.post('submit/referral', dataObject);
	};

	this.updateReferral = function(){
		return api.put('submit/referral');
	};

	this.getAssignedReferrals = function(){
		return api.get('assigned/referrals');
	};

	this.getOfferedReferrals = function(){
		return api.get('offered/referrals');
	};

	this.updateOffer = function(dataObject){
		return api.put('assigned/referral', dataObject);
	};
});

app.service("usageService", function(api){

  this.getUsage = function(dataObject){
    return api.get('usage', dataObject)
  };
});
