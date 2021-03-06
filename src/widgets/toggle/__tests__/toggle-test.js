/* eslint-env mocha */

import React from 'react';
import expect from 'expect';
import sinon from 'sinon';

import {createRenderer} from 'react-addons-test-utils';

import toggle from '../toggle';
import defaultTemplates from '../defaultTemplates.js';
import RefinementList from '../../../components/RefinementList/RefinementList';
import Template from '../../../components/Template';

import expectJSX from 'expect-jsx';
expect.extend(expectJSX);
import createHelpers from '../../../lib/createHelpers.js';

describe('toggle()', () => {
  const helpers = createHelpers('en-US');
  const renderer = createRenderer();

  context('bad usage', () => {
    it('throws when no container', () => {
      expect(() => {
        toggle();
      }).toThrow(/Container must be `string` or `HTMLElement`/);
    });

    it('throws when no attributeName', () => {
      expect(() => {
        toggle({container: document.createElement('div')});
      }).toThrow(/Usage:/);
    });

    it('throws when no label', () => {
      expect(() => {
        toggle({container: document.createElement('div'), attributeName: 'Hello'});
      }).toThrow(/Usage:/);
    });
  });

  context('good usage', () => {
    let ReactDOM;
    let autoHideContainer;
    let headerFooter;
    let container;
    let widget;
    let attributeName;
    let label;

    beforeEach(() => {
      ReactDOM = {render: sinon.spy()};
      autoHideContainer = sinon.stub().returns(RefinementList);
      headerFooter = sinon.stub().returns(RefinementList);

      toggle.__Rewire__('ReactDOM', ReactDOM);
      toggle.__Rewire__('autoHideContainerHOC', autoHideContainer);
      toggle.__Rewire__('headerFooterHOC', headerFooter);

      container = document.createElement('div');
      label = 'Hello, ';
      attributeName = 'world!';
      widget = toggle({container, attributeName, label});
    });

    it('configures hitsPerPage', () => {
      expect(widget.getConfiguration()).toEqual({facets: ['world!']});
    });

    it('uses autoHideContainer() and headerFooter()', () => {
      expect(autoHideContainer.calledOnce).toBe(true);
      expect(headerFooter.calledOnce).toBe(true);
      expect(headerFooter.calledBefore(autoHideContainer)).toBe(true);
    });

    context('render', () => {
      let templateProps;
      let results;
      let helper;
      let state;
      let props;
      let createURL;

      beforeEach(() => {
        templateProps = {
          templatesConfig: undefined,
          templates: defaultTemplates,
          useCustomCompileOptions: {header: false, item: false, footer: false},
          transformData: undefined
        };
        helper = {
          state: {
            isFacetRefined: sinon.stub().returns(false)
          },
          removeFacetRefinement: sinon.spy(),
          addFacetRefinement: sinon.spy(),
          search: sinon.spy()
        };
        state = {
          toggleRefinement: sinon.spy(),
          isFacetRefined: sinon.stub().returns(false)
        };
        props = {
          cssClasses: {
            root: 'ais-toggle',
            header: 'ais-toggle--header',
            body: 'ais-toggle--body',
            footer: 'ais-toggle--footer',
            list: 'ais-toggle--list',
            item: 'ais-toggle--item',
            active: 'ais-toggle--item__active',
            label: 'ais-toggle--label',
            checkbox: 'ais-toggle--checkbox',
            count: 'ais-toggle--count'
          },
          collapsible: false,
          templateProps,
          createURL() {},
          toggleRefinement() {}
        };
        createURL = () => '#';
        widget.init({state});
      });

      it('calls twice ReactDOM.render', () => {
        results = {
          hits: [{Hello: ', world!'}],
          nbHits: 1,
          getFacetValues: sinon.stub().returns([{name: 'true', count: 2}, {name: 'false', count: 1}])
        };
        widget = toggle({container, attributeName, label});
        widget.render({results, helper, state, createURL});
        widget.render({results, helper, state, createURL});
        expect(ReactDOM.render.calledTwice).toBe(true, 'ReactDOM.render called twice');
        expect(ReactDOM.render.firstCall.args[1]).toEqual(container);
        expect(ReactDOM.render.secondCall.args[1]).toEqual(container);
      });

      it('formats counts', () => {
        templateProps.templatesConfig = {helpers};
        renderer.render(<Template data={{count: 1000}} {...templateProps} templateKey="item" />);
        const out = renderer.getRenderOutput();
        // eslint-disable-next-line max-len
        expect(out).toEqualJSX(<div dangerouslySetInnerHTML={{__html: '<label class="">\n <input type="checkbox" class="" value="" />\n <span class="">1,000</span>\n</label>'}} />);
      });

      it('understands cssClasses', () => {
        results = {
          hits: [{Hello: ', world!'}],
          nbHits: 1,
          getFacetValues: sinon.stub().returns([{name: 'true', count: 2}, {name: 'false', count: 1}])
        };
        props.cssClasses.root += ' root cx';
        props = {
          facetValues: [{count: 1, isRefined: false, name: label}],
          shouldAutoHideContainer: false,
          ...props
        };
        const cssClasses = {root: ['root', 'cx']};
        widget = toggle({container, attributeName, label, cssClasses});
        widget.init({state, helper});
        widget.render({results, helper, state, createURL});
        expect(ReactDOM.render.firstCall.args[0]).toEqualJSX(<RefinementList {...props} />);
      });

      it('with facet values', () => {
        results = {
          hits: [{Hello: ', world!'}],
          nbHits: 1,
          getFacetValues: sinon.stub().returns([{name: 'true', count: 2}, {name: 'false', count: 1}])
        };
        widget = toggle({container, attributeName, label});
        widget.init({state, helper});
        widget.render({results, helper, state, createURL});
        widget.render({results, helper, state, createURL});

        props = {
          facetValues: [{count: 1, isRefined: false, name: label}],
          shouldAutoHideContainer: false,
          ...props
        };

        expect(ReactDOM.render.firstCall.args[0]).toEqualJSX(<RefinementList {...props} />);
        expect(ReactDOM.render.secondCall.args[0]).toEqualJSX(<RefinementList {...props} />);
      });

      it('understands numerical facets results', () => {
        results = {
          nbHits: 2,
          getFacetStats: sinon.stub().returns({sum: 200})
        };
        widget = toggle({container, values: {on: 1, off: 2}, attributeName, label});
        widget.init({state, helper});
        widget.render({results, helper, state, createURL});

        props = {
          facetValues: [{count: 200, isRefined: false, name: label}],
          shouldAutoHideContainer: false,
          ...props
        };

        expect(results.getFacetStats.args[0][0]).toEqual(attributeName);
        expect(ReactDOM.render.firstCall.args[0]).toEqualJSX(<RefinementList {...props} />);
      });

      it('without facet values', () => {
        results = {
          hits: [],
          nbHits: 0,
          getFacetValues: sinon.stub().returns([])
        };
        widget = toggle({container, attributeName, label});
        widget.init({state, helper});
        widget.render({results, helper, state, createURL});
        widget.render({results, helper, state, createURL});

        props = {
          facetValues: [{name: label, isRefined: false, count: null}],
          shouldAutoHideContainer: true,
          ...props
        };

        expect(ReactDOM.render.firstCall.args[0]).toEqualJSX(<RefinementList {...props} />);
        expect(ReactDOM.render.secondCall.args[0]).toEqualJSX(<RefinementList {...props} />);
      });

      it('when refined', () => {
        helper = {
          state: {
            isFacetRefined: sinon.stub().returns(true)
          }
        };
        results = {
          hits: [{Hello: ', world!'}],
          nbHits: 1,
          getFacetValues: sinon.stub().returns([{name: 'true', count: 2}, {name: 'false', count: 1}])
        };
        widget = toggle({container, attributeName, label});
        widget.init({state, helper});
        widget.render({results, helper, state, createURL});
        widget.render({results, helper, state, createURL});

        props = {
          facetValues: [{count: 2, isRefined: true, name: label}],
          shouldAutoHideContainer: false,
          ...props
        };

        expect(ReactDOM.render.firstCall.args[0]).toEqualJSX(<RefinementList {...props} />);
        expect(ReactDOM.render.secondCall.args[0]).toEqualJSX(<RefinementList {...props} />);
      });

      it('using props.toggleRefinement', () => {
        results = {
          hits: [{Hello: ', world!'}],
          nbHits: 1,
          getFacetValues: sinon.stub().returns([{name: 'true', count: 2}, {name: 'false', count: 1}])
        };
        widget = toggle({container, attributeName, label});
        widget.init({state, helper});
        widget.render({results, helper, state, createURL});
        const toggleRefinement = ReactDOM.render.firstCall.args[0].props.toggleRefinement;
        expect(toggleRefinement).toBeA('function');
        toggleRefinement();
        expect(helper.addFacetRefinement.calledOnce).toBe(true);
        expect(helper.addFacetRefinement.calledWithExactly(attributeName, true));
        helper.hasRefinements = sinon.stub().returns(true);
      });
    });

    context('toggleRefinement', () => {
      let helper;
      let values;

      function toggleOn() {
        widget.toggleRefinement(helper, 'facetValueToRefine', false);
      }
      function toggleOff() {
        widget.toggleRefinement(helper, 'facetValueToRefine', true);
      }

      beforeEach(() => {
        helper = {
          removeFacetRefinement: sinon.spy(),
          addFacetRefinement: sinon.spy(),
          search: sinon.spy()
        };
      });

      context('default values', () => {
        it('toggle on should add filter to true', () => {
          // Given
          widget = toggle({container, attributeName, label});

          // When
          toggleOn();

          // Then
          expect(helper.addFacetRefinement.calledWith(attributeName, true)).toBe(true);
          expect(helper.removeFacetRefinement.called).toBe(false);
        });
        it('toggle off should remove all filters', () => {
          // Given
          widget = toggle({container, attributeName, label});

          // When
          toggleOff();

          // Then
          expect(helper.removeFacetRefinement.calledWith(attributeName, true)).toBe(true);
          expect(helper.addFacetRefinement.called).toBe(false);
        });
      });
      context('specific values', () => {
        it('toggle on should change the refined value', () => {
          // Given
          values = {on: 'on', off: 'off'};
          widget = toggle({container, attributeName, label, values});

          // When
          toggleOn();

          // Then
          expect(helper.removeFacetRefinement.calledWith(attributeName, 'off')).toBe(true);
          expect(helper.addFacetRefinement.calledWith(attributeName, 'on')).toBe(true);
        });
        it('toggle off should change the refined value', () => {
          // Given
          values = {on: 'on', off: 'off'};
          widget = toggle({container, attributeName, label, values});

          // When
          toggleOff();

          // Then
          expect(helper.removeFacetRefinement.calledWith(attributeName, 'on')).toBe(true);
          expect(helper.addFacetRefinement.calledWith(attributeName, 'off')).toBe(true);
        });
      });
    });

    context('custom off value', () => {
      it('should add a refinement for custom off value on init', () => {
        // Given
        const values = {on: 'on', off: 'off'};
        widget = toggle({container, attributeName, label, values});
        const state = {
          isFacetRefined: sinon.stub().returns(false)
        };
        const helper = {
          addFacetRefinement: sinon.spy()
        };

        // When
        widget.init({state, helper});

        // Then
        expect(helper.addFacetRefinement.calledWith(attributeName, 'off')).toBe(true);
      });
      it('should not add a refinement for custom off value on init if already checked', () => {
        // Given
        const values = {on: 'on', off: 'off'};
        widget = toggle({container, attributeName, label, values});
        const state = {
          isFacetRefined: sinon.stub().returns(true)
        };
        const helper = {
          addFacetRefinement: sinon.spy()
        };

        // When
        widget.init({state, helper});

        // Then
        expect(helper.addFacetRefinement.called).toBe(false);
      });
      it('should not add a refinement for no custom off value on init', () => {
        // Given
        widget = toggle({container, attributeName, label});
        const state = {};
        const helper = {
          addFacetRefinement: sinon.spy()
        };

        // When
        widget.init({state, helper});

        // Then
        expect(helper.addFacetRefinement.called).toBe(false);
      });
    });

    afterEach(() => {
      toggle.__ResetDependency__('ReactDOM');
      toggle.__ResetDependency__('autoHideContainerHOC');
      toggle.__ResetDependency__('headerFooterHOC');
    });
  });
});
