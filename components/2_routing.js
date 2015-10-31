app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

	$urlRouterProvider.otherwise('/');

	//$locationProvider.html5Mode(true);

	$stateProvider
		.state('root', {
			url: '/',
			controller: 'MainCtrl as mainCtrl',
			templateUrl: 'templates/pages/_root.html'
		})

})