import React, { createRef } from 'react';
import { shallow } from 'enzyme';
import each from 'jest-each';
import { BaseWidgetProps } from '../base_props';
import { BaseWidget, viewFunction as BaseWidgetComponent } from '../base_widget';
import { RootSvgElement } from '../renderers/svg_root';
import { GrayScaleFilter } from '../renderers/gray_scale_filter';
import { ConfigProvider } from '../../../ui/common/config_provider';
import config from '../../../../core/config';
import { clear as clearEventHandlers } from '../../../test_utils/events_mock';
import { Canvas } from '../common/types.d';

describe('BaseWidget', () => {
  describe('View', () => {
    it('should pass size property and defs child element to the svg element (by default)', () => {
      const widget = shallow(<BaseWidgetComponent {...{ props: {} } as any} /> as JSX.Element);

      expect(widget.find(RootSvgElement).props()).toMatchObject({
        height: 0,
        width: 0,
      });
      expect(widget.find(RootSvgElement).childAt(0).html()).toEqual('<defs></defs>');
    });

    it('should pass all necessary properties: canvas and classes', () => {
      const props = {
        canvas: {
          width: 820,
          height: 440,
        },
        classes: 'root-class',
      } as BaseWidgetProps;
      const widget = shallow(<BaseWidgetComponent {...{
        cssClasses: 'container-class',
        props,
      } as any}
      /> as JSX.Element);

      expect(widget.props().className).toBe('container-class');
      expect(widget.find(RootSvgElement).props()).toMatchObject({
        className: 'root-class',
        height: 440,
        width: 820,
      });
    });

    it('should pass REF into the root svg element', () => {
      const svgRef = createRef<SVGElement>();
      const widget = shallow(<BaseWidgetComponent {...{
        svgElementRef: svgRef,
        props: {},
      } as any}
      /> as JSX.Element);

      expect(widget.find(RootSvgElement).props().rootElementRef).toBe(svgRef);
    });

    it('should render ConfigProvider if shouldRenderConfigProvider is true', () => {
      const widget = shallow(<BaseWidgetComponent {...{
        shouldRenderConfigProvider: true,
        props: {},
      } as any}
      /> as JSX.Element);

      expect(widget.find(ConfigProvider)).toHaveLength(1);
    });

    it('should render children', () => {
      const props = {
        children: <path className="child" />,
      } as BaseWidgetProps;
      const widget = shallow(<BaseWidgetComponent {...{ props } as any} /> as JSX.Element);

      expect(widget.find('.child').exists()).toBe(true);
    });

    it('should render filter when disabled', () => {
      const props = {
        disabled: true,
      } as BaseWidgetProps;
      const widget = shallow(<BaseWidgetComponent {...{ props } as any} /> as JSX.Element);

      expect(widget.find(RootSvgElement).props()).toMatchObject({
        filter: 'url(#DevExpress_1)',
      });
      expect(widget.find(GrayScaleFilter).exists()).toBe(true);
      expect(widget.find(GrayScaleFilter).props().id).toBe('DevExpress_1');
    });
  });

  describe('Behavior', () => {
    describe('Effects', () => {
      afterEach(clearEventHandlers);

      describe('contentReadyEffect', () => {
        it('should call "onContentReady" callback with the content node\'s parent', () => {
          const onContentReady = jest.fn();
          const widget = new BaseWidget({ onContentReady });
          const svgElement = {};
          widget.svgElementRef = svgElement as SVGElement;
          widget.contentReadyEffect();
          expect(onContentReady).toHaveBeenCalledTimes(1);
          expect(onContentReady).toHaveBeenCalledWith({ element: svgElement });
        });

        it('should not raise any error if "onContentReady" is not defined', () => {
          const widget = new BaseWidget({ onContentReady: undefined });
          expect(widget.contentReadyEffect.bind(widget)).not.toThrow();
        });
      });
    });
  });

  describe('Methods', () => {
    describe('svg method', () => {
      it('should return svg root element', () => {
        const widget = new BaseWidget({ });
        const root = { } as SVGElement;
        widget.svgElementRef = root;

        expect(widget.svg()).toEqual(root);
      });
    });
  });

  describe('Logic', () => {
    describe('cssClasses', () => {
      it('should add default classes', () => {
        const widget = new BaseWidget({ });
        expect(widget.cssClasses).toBe('dx-widget dx-visibility-change-handler');
      });

      it('should add className property', () => {
        const widget = new BaseWidget({ className: 'custom-class' });
        expect(widget.cssClasses).toBe('dx-widget dx-visibility-change-handler custom-class');
      });
    });

    describe('pointerEventsState', () => {
      it('should return undefined by default', () => {
        const widget = new BaseWidget({ });

        expect(widget.pointerEventsState).toBe(undefined);
      });

      it('should set visible state', () => {
        const widget = new BaseWidget({ pointerEvents: 'visible' });

        expect(widget.pointerEventsState).toBe('visible');
      });

      it('should set disabled state', () => {
        const widget = new BaseWidget({ disabled: true });

        expect(widget.pointerEventsState).toBe('none');
      });
    });

    describe('setCanvas', () => {
      it('should get empty canvas by default', () => {
        const widget = new BaseWidget({ canvas: { } });
        widget.setCanvas();

        expect(widget.props.canvas).toEqual({ });
      });

      it('should get size from props (props.size)', () => {
        const widget = new BaseWidget({ size: { width: 600, height: 400 } });
        widget.setCanvas();

        expect(widget.props.canvas).toMatchObject({
          width: 600,
          height: 400,
        });
      });

      it('should get size from container element', () => {
        const widget = new BaseWidget({ });
        const containerElement = {
          clientWidth: 400,
          clientHeight: 300,
        };
        widget.containerRef = containerElement as HTMLDivElement;
        widget.setCanvas();

        expect(widget.props.canvas).toMatchObject({
          width: 400,
          height: 300,
        });
      });

      it('should get default canvas from props (props.defaultCanvas)', () => {
        const defaultCanvas: Canvas = {
          width: 500,
          height: 300,
          left: 10,
          right: 20,
          top: 30,
          bottom: 40,
        };
        const widget = new BaseWidget({ defaultCanvas });
        widget.setCanvas();

        expect(widget.props.canvas).toEqual({
          width: 500,
          height: 300,
          left: 10,
          right: 20,
          top: 30,
          bottom: 40,
        });
      });

      it('should get merged size from props.size and container element', () => {
        const widget = new BaseWidget({
          size: { width: 600, height: undefined },
          canvas: { width: 300, height: 100 },
        });
        const containerElement = {
          clientWidth: 400,
          clientHeight: 300,
        };
        widget.containerRef = containerElement as HTMLDivElement;
        widget.setCanvas();

        expect(widget.props.canvas).toMatchObject({
          width: 600,
          height: 300,
        });
      });

      it('should get merged canvas from props (size, margin and defaultCanvas)', () => {
        const defaultCanvas: Canvas = {
          width: 500,
          height: 300,
          left: 10,
          right: 20,
          top: 30,
          bottom: 40,
        };
        const widget = new BaseWidget({
          size: { width: 600 },
          defaultCanvas,
          margin: {
            left: 20,
            top: 40,
          },
        });
        widget.setCanvas();

        expect(widget.props.canvas).toEqual({
          width: 600,
          height: 300,
          left: 20,
          right: 20,
          top: 40,
          bottom: 40,
        });
      });

      it('should get merged size from props (size is not valid, and defaultCanvas)', () => {
        const defaultCanvas: Canvas = {
          width: 500,
          height: 300,
        };
        const widget = new BaseWidget({
          size: {
            width: -600,
            height: -400,
          },
          defaultCanvas,
        });
        widget.setCanvas();

        expect(widget.props.canvas).toEqual({
          width: 500,
          height: 300,
        });
      });

      it('should get default canvas from props (if any side is negative)', () => {
        const defaultCanvas: Canvas = {
          width: 500,
          height: 300,
          left: 10,
          right: 20,
          top: 30,
          bottom: 40,
        };
        const widget = new BaseWidget({
          size: { width: 600, height: 400 },
          defaultCanvas,
          margin: {
            top: 300,
            bottom: 100,
            left: 200,
            right: 400,
          },
        });
        widget.setCanvas();

        expect(widget.props.canvas).toEqual({
          width: 500,
          height: 300,
          left: 10,
          right: 20,
          top: 30,
          bottom: 40,
        });
      });
    });

    describe('shouldRenderConfigProvider', () => {
      each`
        global       | rtlEnabled   | parentRtlEnabled | expected
        ${true}      | ${true}      | ${true}          | ${false}
        ${undefined} | ${undefined} | ${undefined}     | ${false}
        ${true}      | ${true}      | ${undefined}     | ${true}
        ${true}      | ${false}     | ${undefined}     | ${true}
        ${true}      | ${true}      | ${false}         | ${true}
        ${true}      | ${false}     | ${true}          | ${true}
        ${true}      | ${undefined} | ${undefined}     | ${true}
        ${true}      | ${undefined} | ${true}          | ${false}
        ${true}      | ${undefined} | ${false}         | ${false}
        ${true}      | ${true}      | ${true}          | ${false}
        `
        .describe('shouldRenderConfigProvider truth table', ({
          global, rtlEnabled, parentRtlEnabled, expected,
        }) => {
          const name = `${JSON.stringify({
            global, rtlEnabled, parentRtlEnabled, expected,
          })}`;

          it(name, () => {
            config().rtlEnabled = global;
            const widget = new BaseWidget({ rtlEnabled });
            widget.config = { rtlEnabled: parentRtlEnabled };
            expect(widget.shouldRenderConfigProvider).toBe(expected);
          });
        });

      it('should return global config when context config is undefined', () => {
        config().rtlEnabled = false;
        const widget = new BaseWidget({ rtlEnabled: false });
        widget.config = undefined;
        expect(widget.shouldRenderConfigProvider).toBe(true);
      });

      it('should return global config when props.rtlEnabled is undefined', () => {
        config().rtlEnabled = true;
        const widget = new BaseWidget({ rtlEnabled: undefined });
        widget.config = undefined;
        expect(widget.shouldRenderConfigProvider).toBe(true);
      });
    });

    describe('rtlEnabled', () => {
      it('should return value from props if props has value', () => {
        const widget = new BaseWidget({ rtlEnabled: false });
        // emulate context
        widget.config = { rtlEnabled: true };

        expect(widget.rtlEnabled).toBe(false);
      });

      it('should return value from parent rtlEnabled context if props isnt defined', () => {
        const widget = new BaseWidget({ });
        // emulate context
        widget.config = { rtlEnabled: true };
        expect(widget.rtlEnabled).toBe(true);
      });

      it('should return value from config if any other props isnt defined', () => {
        config().rtlEnabled = true;
        const widget = new BaseWidget({ });
        expect(widget.rtlEnabled).toBe(true);
      });
    });
  });
});
