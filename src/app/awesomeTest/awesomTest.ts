import {Observable} from 'rxjs/Observable';
import {of} from 'rxjs/observable/of';

export class AwesomTest {

    constructor() {
    }

    getHero(): Observable<string> {
        of('Test').subscribe(e => console.log('E', e))
        return of('Spiderman');
    }
}