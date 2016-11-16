/**
 * External dependencies
 */
import sinon from 'sinon';
import { expect } from 'chai';
import { Map } from 'immutable';

/**
 * Internal dependencies
 */
import {
	THEME_ACTIVATE_REQUEST,
	THEME_ACTIVATE_REQUEST_SUCCESS,
	THEME_ACTIVATE_REQUEST_FAILURE,
	THEME_REQUEST,
	THEME_REQUEST_SUCCESS,
	THEME_REQUEST_FAILURE,
	THEMES_RECEIVE,
	THEMES_REQUEST,
	THEMES_REQUEST_SUCCESS,
	THEMES_REQUEST_FAILURE
} from 'state/action-types';
import {
	themeActivated,
	activateTheme,
	receiveTheme,
	receiveThemes,
	requestThemes,
	requestTheme
} from '../actions';
import useNock from 'test/helpers/use-nock';

describe( 'actions', () => {
	const spy = sinon.spy();

	beforeEach( () => {
		spy.reset();
	} );

	describe( '#receiveTheme()', () => {
		it( 'should return an action object', () => {
			const theme = { id: 'twentysixteen', name: 'Twenty Sixteen' };
			const action = receiveTheme( theme, 77203074 );

			expect( action ).to.eql( {
				type: THEMES_RECEIVE,
				themes: [ theme ],
				siteId: 77203074
			} );
		} );
	} );

	describe( '#receiveThemes()', () => {
		it( 'should return an action object', () => {
			const themes = [ { id: 'twentysixteen', name: 'Twenty Sixteen' } ];
			const action = receiveThemes( themes, 77203074 );

			expect( action ).to.eql( {
				type: THEMES_RECEIVE,
				themes,
				siteId: 77203074
			} );
		} );
	} );

	describe( '#requestThemes()', () => {
		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.persist()
				.get( '/rest/v1.2/themes' )
				.reply( 200, {
					found: 2,
					themes: [
						{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						{ ID: 'mood', name: 'Mood' }
					]
				} )
				.get( '/rest/v1.2/themes' )
				.query( { search: 'Sixteen' } )
				.reply( 200, {
					found: 1,
					themes: [ { ID: 'twentysixteen', name: 'Twenty Sixteen' } ]
				} )
				.get( '/rest/v1/sites/77203074/themes' )
				.reply( 200, {
					found: 2,
					themes: [
						{ ID: 'twentyfifteen', name: 'Twenty Fifteen' },
						{ ID: 'twentysixteen', name: 'Twenty Sixteen' }
					]
				} )
				.get( '/rest/v1/sites/77203074/themes' )
				.query( { search: 'Sixteen' } )
				.reply( 200, {
					found: 1,
					themes: [ { ID: 'twentysixteen', name: 'Twenty Sixteen' } ]
				} )
				.get( '/rest/v1/sites/1916284/themes' )
				.reply( 403, {
					error: 'authorization_required',
					message: 'User cannot access this private blog.'
				} );
		} );

		context( 'with a wpcom site', () => {
			it( 'should dispatch fetch action when thunk triggered', () => {
				requestThemes( 2916284 )( spy );

				expect( spy ).to.have.been.calledWith( {
					type: THEMES_REQUEST,
					siteId: 'wpcom',
					query: {}
				} );
			} );

			it( 'should dispatch themes receive action when request completes', () => {
				return requestThemes( 2916284 )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_RECEIVE,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
							{ ID: 'mood', name: 'Mood' }
						],
						siteId: 'wpcom'
					} );
				} );
			} );

			it( 'should dispatch themes request success action when request completes', () => {
				return requestThemes( 2916284 )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 'wpcom',
						query: {},
						found: 2,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
							{ ID: 'mood', name: 'Mood' }
						]
					} );
				} );
			} );

			it( 'should dispatch themes request success action with query results', () => {
				return requestThemes( 2916284, false, { search: 'Sixteen' } )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 'wpcom',
						query: { search: 'Sixteen' },
						found: 1,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						]
					} );
				} );
			} );
		} );

		context( 'with a Jetpack site', () => {
			it( 'should dispatch fetch action when thunk triggered', () => {
				requestThemes( 77203074, true )( spy );

				expect( spy ).to.have.been.calledWith( {
					type: THEMES_REQUEST,
					siteId: 77203074,
					query: {}
				} );
			} );

			it( 'should dispatch themes receive action when request completes', () => {
				return requestThemes( 77203074, true )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_RECEIVE,
						themes: [
							{ ID: 'twentyfifteen', name: 'Twenty Fifteen' },
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						],
						siteId: 77203074
					} );
				} );
			} );

			it( 'should dispatch themes request success action when request completes', () => {
				return requestThemes( 77203074, true )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 77203074,
						query: {},
						found: 2,
						themes: [
							{ ID: 'twentyfifteen', name: 'Twenty Fifteen' },
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						]
					} );
				} );
			} );

			it( 'should dispatch themes request success action with query results', () => {
				return requestThemes( 77203074, true, { search: 'Sixteen' } )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_SUCCESS,
						siteId: 77203074,
						query: { search: 'Sixteen' },
						found: 1,
						themes: [
							{ ID: 'twentysixteen', name: 'Twenty Sixteen' },
						]
					} );
				} );
			} );

			it( 'should dispatch fail action when request fails', () => {
				return requestThemes( 1916284, true )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_REQUEST_FAILURE,
						siteId: 1916284,
						query: {},
						error: sinon.match( { message: 'User cannot access this private blog.' } )
					} );
				} );
			} );
		} );
	} );

	describe( '#requestTheme()', () => {
		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.persist()
				.get( '/rest/v1.2/themes/twentysixteen' )
				.reply( 200, { id: 'twentysixteen', title: 'Twenty Sixteen' } )
				.get( '/rest/v1.2/themes/twentyumpteen' )
				.reply( 404, {
					error: 'unknown_theme',
					message: 'Unknown theme'
				} );
		} );

		context( 'with a wpcom site', () => {
			it( 'should dispatch request action when thunk triggered', () => {
				requestTheme( 'twentysixteen', 2916284 )( spy );

				expect( spy ).to.have.been.calledWith( {
					type: THEME_REQUEST,
					siteId: 'wpcom',
					themeId: 'twentysixteen'
				} );
			} );

			it( 'should dispatch themes receive action when request completes', () => {
				return requestTheme( 'twentysixteen', 2916284 )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEMES_RECEIVE,
						themes: [
							sinon.match( { id: 'twentysixteen', title: 'Twenty Sixteen' } )
						],
						siteId: 'wpcom'
					} );
				} );
			} );

			it( 'should dispatch themes request success action when request completes', () => {
				return requestTheme( 'twentysixteen', 2916284 )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEME_REQUEST_SUCCESS,
						siteId: 'wpcom',
						themeId: 'twentysixteen'
					} );
				} );
			} );

			it( 'should dispatch fail action when request fails', () => {
				return requestTheme( 'twentyumpteen', 2916284 )( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: THEME_REQUEST_FAILURE,
						siteId: 'wpcom',
						themeId: 'twentyumpteen',
						error: sinon.match( { message: 'Unknown theme' } )
					} );
				} );
			} );
		} );
		context( 'with a Jetpack site', () => {
			// TODO!
			// But do we have a theme details endpoint on Jetpack sites at all?
		} );
	} );

	describe( '#themeActivated()', () => {
		it( 'should return an action object', () => {
			const expectedActivationSuccess = {
				meta: {
					analytics: [
						{
							payload: {
								name: 'calypso_themeshowcase_theme_activate',
								properties: {
									previous_theme: 'twentyfifteen',
									purchased: false,
									search_term: 'simple, white',
									source: 'unknown',
									theme: 'twentysixteen',
								},
								service: 'tracks',
							},
							type: 'ANALYTICS_EVENT_RECORD'
						},
					],
				},
				type: THEME_ACTIVATE_REQUEST_SUCCESS,
				theme: { id: 'twentysixteen' },
				siteId: 2211667,
			};

			const fakeGetState = () => ( {
				themes: {
					currentTheme: Map( {
						currentThemes: Map().set( 2211667, {
							id: 'twentyfifteen'
						} ) } ),
					themesList: Map( {
						query: Map( {
							search: 'simple, white'
						} )
					} )
				}
			} );

			themeActivated( { id: 'twentysixteen' }, 2211667 )( spy, fakeGetState );
			expect( spy ).to.have.been.calledWith( expectedActivationSuccess );
		} );
	} );

	describe( '#activateTheme()', () => {
		const trackingData = {
			theme: 'twentysixteen',
			previous_theme: 'twentyfifteen',
			source: 'unknown',
			purchased: false,
			search_term: 'simple, white'
		};

		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.persist()
				.post( '/rest/v1.1/sites/2211667/themes/mine', { theme: 'twentysixteen' } )
				.reply( 200, { id: 'karuna', version: '1.0.3' } )
				.post( '/rest/v1.1/sites/2211667/themes/mine', { theme: 'badTheme' } )
				.reply( 404, {
					error: 'theme_not_found',
					message: 'The specified theme was not found'
				} );
		} );

		it( 'should dispatch request action when thunk is triggered', () => {
			activateTheme( 'twentysixteen', 2211667 )( spy );

			expect( spy ).to.have.been.calledWith( {
				type: THEME_ACTIVATE_REQUEST,
				siteId: 2211667,
				themeId: 'twentysixteen',
			} );
		} );

		it( 'should dispatch theme activation success thunk when request completes', () => {
			return activateTheme( 'twentysixteen', 2211667, trackingData )( spy ).then( () => {
				expect( spy.secondCall.args[ 0 ].name ).to.equal( 'themeActivatedThunk' );
			} );
		} );

		it( 'should dispatch theme activation failure action when request completes', () => {
			const themeActivationFailure = {
				error: sinon.match( { message: 'The specified theme was not found' } ),
				siteId: 2211667,
				themeId: 'badTheme',
				type: THEME_ACTIVATE_REQUEST_FAILURE
			};

			return activateTheme( 'badTheme', 2211667, trackingData )( spy ).then( () => {
				expect( spy ).to.have.been.calledWith( themeActivationFailure );
			} );
		} );
	} );
} );
