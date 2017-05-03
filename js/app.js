var app = angular.module('app', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/home');

  $stateProvider

    .state({
      name        : 'home',
      url         : '/home',
      templateUrl : 'templates/home.html',
    })
    .state({
      name        : 'signin',
      url         : '/signin',
      templateUrl : 'templates/signin.html',
    })
    .state({
        name        : 'home.list',
        url         : '/list',
        templateUrl : 'templates/home-list.html',
        controller  : 'dogsController'
    })
    .state({
        name        : 'home.paragraph',
        url         : '/paragraph',
        template    : 'I could sure use a drink right now.'
    })
    .state({
            name        : 'about',
            url         : '/about',
            views       : {
                                           '': { templateUrl: 'templates/about.html' },// the main template will be placed here (relatively named)
                            'columnOne@about': { template: 'Look I am a column!' },// the child views will be defined here (absolutely named)
                            'columnTwo@about': { templateUrl: 'templates/table-data.html',
                                                 controller: 'scotchController' //contained in the controllers.js file
                                               }// for column two, we'll define a separate controller
                          }
        });
});
