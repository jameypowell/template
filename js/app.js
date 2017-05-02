var app = angular.module('app', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/home');

  $stateProvider

    .state('home',{
      url         : '/home',
      templateUrl : 'templates/home.html',
    })

    // nested list with custom controller
    .state('home.list', {
        url: '/list',
        templateUrl: 'templates/home-list.html',
        controller: function($scope) {
            $scope.dogs = ['Bernese', 'Husky', 'Goldendoodle'];
        }
    })

    // nested list with just some random string data
    .state('home.paragraph', {
        url: '/paragraph',
        template: 'I could sure use a drink right now.'
    });

});
