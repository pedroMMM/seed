/* jshint -W117,-W030 */
(function () {
    'use strict';

    angular
        .module('app.test')
        .controller('TestController', TestController);

    TestController.$inject = [];

    /* @ngInject */
    function TestController() {
        var vm = this;
        vm.title = 'TestController';

        activate();

        ////////////////

        function activate() {}
    }
})();
