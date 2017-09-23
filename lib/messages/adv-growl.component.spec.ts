/**
 * Created by kevinkreuzer on 08.07.17.
 */
import {TestBed, inject, ComponentFixture} from '@angular/core/testing';
import {GrowlModule, Message} from 'primeng/primeng';
import {AdvGrowlComponent} from './adv-growl.component';
import {AdvGrowlService} from './adv-growl.service';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/never';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import {AdvPrimeMessage} from './adv-growl.model';
import {EventEmitter} from '@angular/core';

describe('Message Component', () => {

    let component: AdvGrowlComponent;
    let fixture: ComponentFixture<AdvGrowlComponent>;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [GrowlModule],
            declarations: [AdvGrowlComponent],
            providers: [AdvGrowlService]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdvGrowlComponent);
        component = fixture.componentInstance;
    });


    const createMessage = (id: string, severity: string, summary: string, detail: string): AdvPrimeMessage => (
        {id, severity, summary, detail}
    );

    describe('Setup and initialization', () => {

        it('should setup the streams and subscribe for messages on init', () => {
            // given
            spyOn(component, 'subscribeForMessages')
            // when
            component.ngOnInit()
            // then
            expect(component.subscribeForMessages)
            expect(component.hoverHelper).toBeDefined()
        })

        it('should create a mousleave stream that emits when a mouseleave event occures', () => {
            // given
            spyOn(Observable, 'fromEvent').and.returnValues(Observable.never(), Observable.of(1))
            // when
            component.ngOnInit()
            // then
            expect(Observable.fromEvent).toHaveBeenCalledWith(component.growlMessage.nativeElement, 'mouseleave')
        })
    })

    describe('Subscribe for messages', () => {

        it(`should add all arriving messages and not emit a new value which indicates that
            none of the messages should be removed`,
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                    // given
                    const expectedMessages: Array<AdvPrimeMessage> = [
                        createMessage('1', 'success', 'awesome message', 'awesome detail'),
                        createMessage('2', 'wanring', 'awesome message', 'awesome detail'),
                        createMessage('3', 'error', 'awesome message', 'awesome detail')
                    ];
                    const messages$ = Observable.create(observer => {
                        expectedMessages.forEach(message => {
                            observer.next(message);
                        });
                    });
                    spyOn(messagesService, 'getMessageStream').and.returnValue(messages$);
                    spyOn(messagesService, 'getCancelStream').and.returnValue(Observable.never());
                    // when
                    component.subscribeForMessages();
                    // then
                    expect(component.messages).toEqual(expectedMessages);
                }
            ));

        it('it should call removeMessage in subscribe when a message is cleared',
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                // given
                const expectedMessages: Array<Message> = [
                    createMessage('1', 'success', 'awesome message', 'awesome detail'),
                    createMessage('2', 'wanring', 'awesome message', 'awesome detail'),
                    createMessage('3', 'error', 'awesome message', 'awesome detail')
                ];
                const messages$ = Observable.create(observer => {
                    expectedMessages.forEach(message => {
                        observer.next(message);
                    });
                });
                spyOn(messagesService, 'getMessageStream').and.returnValue(messages$);
                spyOn(component, 'getLifeTimeStream').and.returnValue(Observable.of(1));
                spyOn(component, 'removeMessage');
                // when
                component.subscribeForMessages();
                // then
                expect(component.removeMessage).toHaveBeenCalledTimes(3);
            })
        );

        it(`it should call unshift in subscribe until the clearStream emits a value,
            in this case it should automatically resubscribe to the messagestream`,
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                // given
                let numberOfCalls = 0;
                const expectedMessages = [
                    createMessage('1', 'success', 'awesome message', 'awesome detail'),
                    createMessage('2', 'wanring', 'awesome message', 'awesome detail'),
                    createMessage('3', 'error', 'awesome message', 'awesome detail')
                ];
                const messages$ = Observable.create(observer => {
                    expectedMessages.forEach(message => {
                        observer.next(message);
                    });
                });
                spyOn(messagesService, 'getMessageStream').and.returnValue(messages$);
                spyOn(messagesService, 'getCancelStream').and.callFake(() => {
                    if (numberOfCalls === 0) {
                        numberOfCalls++;
                        return Observable.of(1);
                    }
                    return Observable.never();
                });
                spyOn(component, 'getLifeTimeStream').and.returnValue(Observable.of(1));
                spyOn(Array.prototype, 'shift');
                spyOn(component, 'subscribeForMessages').and.callThrough();
                // when
                component.subscribeForMessages();
                // then
                expect(component.subscribeForMessages).toHaveBeenCalledTimes(2);
            }));

        it('should remove the message with the matching messageId', () => {
            // given
            const messageId = '1'
            const message1 = createMessage('1', 'success', 'awesome message', 'awesome detail');
            const message2 = createMessage('2', 'wanring', 'awesome message', 'awesome detail');
            const message3 = createMessage('3', 'error', 'awesome message', 'awesome detail');
            component.messages = [message1, message2, message3];
            // when
            component.removeMessage(messageId);
            // then
            expect(component.messages).toEqual([message2, message3]);
        });

        it('should not remove a message when no matching Id was found', () => {
            // given
            const messageId = '4';
            const message1 = createMessage('1', 'success', 'awesome message', 'awesome detail');
            const message2 = createMessage('2', 'wanring', 'awesome message', 'awesome detail');
            const message3 = createMessage('3', 'error', 'awesome message', 'awesome detail');
            component.messages = [message1, message2, message3];
            // when
            component.removeMessage(messageId);
            // then
            expect(component.messages).toEqual([message1, message2, message3]);
        });

        it('should throw an error when an error occures',
            inject([AdvGrowlService], (messagesService: AdvGrowlService) => {
                // given
                const errorMessage = 'Awful error';
                const messages$ = Observable.throw(new Error(errorMessage));
                spyOn(messagesService, 'getMessageStream').and.returnValue(messages$);
                // when then
                expect(() => component.subscribeForMessages()).toThrowError(errorMessage);
            }));
    })

    describe('Get Life time streams', () => {

        describe('Life time detection', () => {

            it('should have a lifeTime if the life property is bigger than the DEFAULT_LIFETIME', () => {
                // given
                component.life = 2000
                // when
                const hasLifeTime = component.hasLifeTime()
                // then
                expect(hasLifeTime).toBeTruthy()
            })

            it('should not have a lifeTime if the life property is small or equal to the DEFAULT_LIFETIME', () => {
                // given
                component.life = 0
                // when
                const hasLifeTime = component.hasLifeTime()
                // then
                expect(hasLifeTime).toBeFalsy()
            })
        })

        describe('Get LifeTime Stream', () => {

            it('should get an finit stream if the message has a lifetime', () => {
                // given
                const messageId = '42'
                spyOn(component, 'hasLifeTime').and.returnValue(true)
                spyOn(component, 'getFinitStream')
                // when
                component.getLifeTimeStream(messageId)
                // then
                expect(component.getFinitStream).toHaveBeenCalled()
            })

            it('should get an infinit stream if the message has no lifetime', () => {
                // given
                const messageId = '42'
                spyOn(component, 'hasLifeTime').and.returnValue(false)
                spyOn(component, 'getInifiniteStream')
                // when
                component.getLifeTimeStream(messageId)
                // then
                expect(component.getInifiniteStream).toHaveBeenCalled()
            })
        })

        describe('Get finit stream', () => {

            it('should get a pausable stream if freezeMessagesOnHover is set to true', () => {
                // given
                const messageId = '42'
                const freezeMessagesOnHover = true
                const lifeTime = 2000
                component.freezeMessagesOnHover = freezeMessagesOnHover
                component.life = lifeTime

                component.hoverHelper = {
                    getPausableMessageStream: (param1, param2) => Observable.of(1)
                } as any
                spyOn(component.hoverHelper, 'getPausableMessageStream').and.returnValue(Observable.of(1))

                // when
                const finitStream = component.getFinitStream(messageId)
                // then
                expect(component.hoverHelper.getPausableMessageStream).toHaveBeenCalledWith(messageId, lifeTime)
                expect(finitStream.subscribe(hoveredMessageId => expect(hoveredMessageId).toBe(messageId)))
            })

            it('should get an unpausable stream if freezeMessagesOnHover is set to false', () => {
                // given
                const messageId = '42'
                const freezeMessagesOnHover = false
                component.freezeMessagesOnHover = freezeMessagesOnHover
                spyOn(component, 'getUnPausableMessageStream').and.returnValue(Observable.of(1))
                // when
                const finitStream = component.getFinitStream(messageId)
                // then
                expect(component.getUnPausableMessageStream).toHaveBeenCalled()
                expect(finitStream.subscribe(hoveredMessageId => expect(hoveredMessageId).toBe(messageId)))
            })

            it('should return a timed observable when we call getUnpausable message stream', () => {
                // given
                const lifeTime = 3000
                component.life = lifeTime
                spyOn(Observable, 'timer')
                // when
                component.getUnPausableMessageStream()
                // then
                expect(Observable.timer).toHaveBeenCalledWith(lifeTime)
            })
        })
    })

    describe('Emitting Events', () => {

        describe('Emitting Clicks', () => {
            it('should call the emitter when the event has a message', () => {
                // given
                const emitter = new EventEmitter<AdvPrimeMessage>();
                spyOn(emitter, 'next')
                const message = createMessage('1', 'succes', 'Summary', 'Super detail')
                const $event = {message}
                // when
                component.emitMessage($event, emitter)
                // then
                expect(emitter.next).toHaveBeenCalledWith(message)
            })

            it('should not call the emitter when the event does not contain a message', () => {
                // given
                const emitter = new EventEmitter<AdvPrimeMessage>();
                spyOn(emitter, 'next')
                const $event = {}
                // when
                component.emitMessage($event, emitter)
                // then
                expect(emitter.next).not.toHaveBeenCalled()
            })

            it('should call emit with the event and the onClick emitter when a message is clicked', () => {
                // given
                const $event = {message: 'Sample Message'}
                spyOn(component, 'emitMessage')
                // when
                component.messageClicked($event)
                // then
                expect(component.emitMessage).toHaveBeenCalledWith($event, component.onClick)
            })

            it('should call emit with the event and the onClose emitter when a message is closed', () => {
                // given
                const $event = {message: 'Sample Message'}
                spyOn(component, 'emitMessage')
                // when
                component.messageClosed($event)
                // then
                expect(component.emitMessage).toHaveBeenCalledWith($event, component.onClose)
            })
        })

        describe('Emiting hover events', () => {

            it('should extract the messageId from the event and call on next on the messageEnter subject', () => {
                // given
                const messageId = '42'
                const $event = {
                    message: {
                        id: messageId
                    }
                }
                // when
                component.messageEntered($event)
                // then
                component.messageEnter$.subscribe(enteredMesssageId => expect(enteredMesssageId).toBe(messageId))
            })
        })
    })
})
