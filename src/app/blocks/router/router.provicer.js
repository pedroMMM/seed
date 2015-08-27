(function () {
    'use strict';

    angular.module('blocks.router').provider('Routes', RoutesProvider);

    RoutesProvider.$inject = ['$locationProvider', '$stateProvider', '$urlRouterProvider'];

    function RoutesProvider($locationProvider, $stateProvider, $urlRouterProvider) {

        this.$get = Routes;

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });

        Routes.$inject = ['$state'];

        function Routes($state) {

            var hasOtherwise = false;

            var service = {
                configureStates: configureStates,
                getStates: getStates
            };

            return service;

            function getStates() {
                return $state.get();
            }

            function configureStates(states, otherwisePath) {
                states.forEach(function (state) {
                    $stateProvider.state(state.state, state.config);
                });

                if (otherwisePath && !hasOtherwise) {
                    hasOtherwise = true;
                    $urlRouterProvider.otherwise(otherwisePath);
                }
            }
        }
    }

})();
