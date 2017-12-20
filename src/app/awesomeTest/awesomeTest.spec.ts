import {AwesomTest} from './awesomTest';
import {of} from 'rxjs/observable/of';
import {ArrayObservable} from 'rxjs/observable/ArrayObservable';

describe('Awesome Test', () => {

    let sut;

    beforeEach(() => {
        sut = new AwesomTest()
    })

    it('must be true', () => {
        // given
        const expectedHero = 'Superman'
        const asserter = {
            next: hero => expect(hero).toBe(expectedHero),
            error: () => fail()
        }
        spyOn(Observable, 'of').and.returnValue('something')
        spyOn(ArrayObservable, 'of').and.returnValue(of('Superman'))
        // when
        const hero$ = sut.getHero()
        // then
        hero$.subscribe(asserter)
    });
});
