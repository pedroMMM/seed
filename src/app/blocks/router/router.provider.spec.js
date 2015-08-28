/* jshint -W117,-W030 */
describe('Routes', function () {

    beforeEach(function () {
        bard.appModule('blocks.router');
        bard.inject('$location', '$state', '$urlRouter', 'Routes');
    });

    it('Routes exists', function () {
        expect(Routes).to.exist;
    });

    it('uses HTML5', function () {
        expect($location.$$html5).to.be.true;
    });

});
