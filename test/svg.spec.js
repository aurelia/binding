import './setup';
import {
  XLinkAttributeObserver,
  DataAttributeObserver,
  StyleObserver
} from '../src/element-observation';
import {ClassObserver} from '../src/class-observer';
import {
  createElement,
  createObserverLocator
} from './shared';
import {
  elements,
  SVGAnalyzer,
  presentationElements,
  presentationAttributes
} from '../src/svg';

// Many svg attributes are picky about what they are assigned.
var attributeValues = {
  clipPathUnits: 'objectBoundingBox',
  d: 'M 10 10 H 90 V 90 H 10 L 10 10',
  edgeMode: 'wrap',
  filterUnits: 'objectBoundingBox',
  gradientTransform: 'rotate(45)',
  gradientUnits: 'userSpaceOnUse',
  keyPoints: '0;0.9;1',
  keySplines: '0 .75 .25 1',
  keyTimes: '0;1',
  lengthAdjust: 'spacing',
  'letter-spacing': '2px',
  markerUnits: 'strokeWidth',
  maskContentUnits: 'userSpaceOnUse',
  maskUnits: 'userSpaceOnUse',
  method: 'stretch',
  mode: 'darken',
  operator: 'arithmetic',
  'feMorphology/operator': 'dilate',
  patternContentUnits: 'objectBoundingBox',
  patternTransform: 'rotate(45)',
  patternUnits: 'objectBoundingBox',
  points: '100,10 250,150 200,110',
  preserveAlpha: 'true',
  preserveAspectRatio: 'none meet',
  primitiveUnits: 'userSpaceOnUse',
  spacing: 'exact',
  spreadMethod: 'pad',
  stitchTiles: 'noStitch',
  transform: 'rotate(45)',
  type: 'gamma',
  'feTurbulence/type': 'fractalNoise',
  'feColorMatrix/type': 'saturate',
  viewBox: '0 0 5 5',
  'word-spacing': '2px',
  xChannelSelector: 'R',
  yChannelSelector: 'G',
};

describe('element observation', () => {
  let analyzer;

  beforeAll(() => {
    analyzer = new SVGAnalyzer();
  });

  it('handles native svg properties', () => {
    var elementNames = Object.getOwnPropertyNames(elements), elementName, element,
        attributeNames, attributeName, i = elementNames.length, j,
        observerLocator = createObserverLocator(), observer, value,
        presentationAttributeNames = Object.getOwnPropertyNames(presentationAttributes);

    while(i--) {
      elementName = elementNames[i];
      attributeNames = elements[elementName];
      if (presentationElements[elementName]) {
        attributeNames.splice(0, 0, ...presentationAttributeNames);
      }
      j = attributeNames.length;
      element = createElement('<svg><' + elementName + '/></svg>').firstElementChild;
      while(j--) {
        attributeName = attributeNames[j];
        expect(analyzer.isStandardSvgAttribute(element.nodeName, attributeName)).toBe(true);

        // not binding to 'onmouseenter' etc.  todo: consider removing these from attribute list.
        if (/^on/.test(attributeName)) {
          continue;
        }

        observer = observerLocator.getObserver(element, attributeName);

        if (/^xlink:.+$/.test(attributeName)) {
          expect(observer instanceof XLinkAttributeObserver).toBe(true);
          continue;
        } else if (attributeName === 'style' || attributeName === 'css') {
          expect(observer instanceof StyleObserver).toBe(true);
          continue;
        } else if (attributeName === 'class') {
          expect(observer instanceof ClassObserver).toBe(true);
          continue;
        } else {
          expect(observer instanceof DataAttributeObserver).toBe(true);
        }

        value = attributeValues[elementName + '/' + attributeName] || attributeValues[attributeName] || '2';
        observer.setValue(value);
        expect(observer.getValue()).toBe(value);
      }
    }
  });
});
