/* jshint -W117,-W030 */
(function () {
    'use strict';

    angular
        .module('app.test').run(runFn);

    runFn.$inject = ['Routes'];

    /* @ngInject */
    function runFn(Routes) {

        Routes.configureStates(getStates(), '/test');
    }

    function getStates() {
        return [
            {
                state: 'test',
                config: {
                    url: '/test',
                    templateUrl: 'app/test/test.html',
                    controller: 'TestController',
                    controllerAs: 'vm'
                }
            }
        ];
    }

})();
