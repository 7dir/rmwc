import React from 'react';
import { render } from '@testing-library/react';
import {
  withTheme,
  randomId,
  wrapChild,
  debounce,
  toCamel,
  toDashCase,
  closest
} from './';
import { FoundationElement } from './foundation-component';
import { wait } from './utils/test-utils';

jest.spyOn(console, 'warn');

describe('RMWC', () => {
  it('works', () => {});
});

describe('FoundationElement', () => {
  it('FoundationElement: handles classNames', () => {
    const inst = {
      root: new FoundationElement(() => {})
    };

    inst.root.addClass('foo');
    inst.root.addClass('foo');
    expect(inst.root.props({}).className.includes('foo')).toBe(true);
    expect(inst.root.hasClass('foo')).toBe(true);

    inst.root.removeClass('foo');
    inst.root.removeClass('foo');
    expect(inst.root.props({}).className.includes('foo')).toBe(false);
    expect(inst.root.hasClass('foo')).toBe(false);
  });

  it('FoundationElement: handles ref', () => {
    const inst = {
      root: new FoundationElement(() => {})
    };

    render(<div ref={inst.root.setRef} />);

    expect(inst.root.ref instanceof HTMLDivElement).toBe(true);
  });

  it('FoundationElement: handles addEventListener / removeEventListener', () => {
    const inst = {
      root: new FoundationElement(() => {})
    };

    // double up on the adds to check that it doesnt add a second time
    const changeHandler = () => {};
    inst.root.addEventListener('change', changeHandler);
    inst.root.addEventListener('change', changeHandler);
    expect(inst.root.props({}).onChange).toBe(changeHandler);

    // double up on the removes to check that it doesnt remove a second time
    inst.root.removeEventListener('change', changeHandler);
    inst.root.removeEventListener('change', changeHandler);
    expect(inst.root.props({}).onChange).toBe(undefined);

    // Check to make sure we can add a bogus one
    inst.root.addEventListener('onChange', changeHandler);
  });

  it('FoundationElement: handles setStyle', () => {
    const inst = {
      root: new FoundationElement(() => {})
    };

    inst.root.setStyle('color', 'red');
    inst.root.setStyle('color', 'red');
    inst.root.setStyle('--myvar', 'red');
    expect(inst.root.props({}).style).toEqual({
      color: 'red',
      '--myvar': 'red'
    });

    inst.root.setStyle('color', 'blue');

    expect(inst.root.props({}).style).toEqual({
      color: 'blue',
      '--myvar': 'red'
    });
  });

  it('FoundationElement: handles prop setters / getters', () => {
    const inst = {
      root: new FoundationElement<any, any>(() => {})
    };

    inst.root.setProp('title', 'red');
    inst.root.setProp('title', 'red');
    expect(inst.root.props({}).title).toBe('red');
    expect(inst.root.getProp('title')).toBe('red');
    expect(inst.root.removeProp('title'));
    expect(inst.root.removeProp('title'));
    expect(inst.root.getProp('title')).toBe(undefined);
  });

  it('FoundationElement: handles prop merging', async () => {
    let blueChangeCalled = false;
    let redChangeCalled = false;
    const el = (
      <div
        className="blue"
        style={{ background: 'blue' }}
        onChange={() => (blueChangeCalled = true)}
      />
    );

    const inst = {
      root: new FoundationElement<any, any>(() => {})
    };

    inst.root.addClass('red');
    inst.root.setStyle('color', 'red');
    inst.root.addEventListener('change', () => (redChangeCalled = true));

    await wait(100);
    const mergedProps = inst.root.props(el.props);
    mergedProps.onChange();

    expect(mergedProps.className).toBe('blue red');
    expect(mergedProps.style).toEqual({ color: 'red', background: 'blue' });
    expect(blueChangeCalled).toBe(true);
    expect(redChangeCalled).toBe(true);
  });
});

describe('Utils', () => {
  it('randomId', () => {
    // @ts-ignore
    process.env.NODE_ENV = 'production';
    randomId();
    // @ts-ignore
    process.env.NODE_ENV = 'test';
  });

  it('debounce', (done) => {
    let val = 0;
    const foo = () => val++;
    const debouncedFoo = debounce(foo, 100);
    debouncedFoo();
    setTimeout(() => {
      expect(val).toBe(1);
      done();
    }, 150);
  });

  it('closest', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    parent.classList.add('foo');

    parent.appendChild(child);

    expect(closest(child, '.foo')).toBe(parent);
    expect(closest(null, '.foo')).toBe(null);
  });

  it('wrapChild', () => {
    const Foo = (props: any) => {
      return wrapChild({ ...props, className: 'foo' });
    };

    const { container } = render(
      <Foo>
        <div className="child" />
      </Foo>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="foo child"
        >
          <div
            class="child"
          />
        </div>
      </div>
    `);
    expect(container.firstChild).toHaveClass('foo child');
  });

  it('toCamel', () => {
    expect(toCamel('test-foo')).toBe('testFoo');
  });

  it('toDashCase', () => {
    expect(toDashCase('testFoo')).toBe('test-foo');
  });
});

describe('withTheme', () => {
  it('works with and without classnames', () => {
    const Component = withTheme(({ ...rest }) => <div {...rest} />);
    const { container, rerender } = render(
      <Component className="test" theme="primary" />
    );
    expect(container.firstChild).toHaveClass('test');

    rerender(<Component className="test" />);
    expect(container.firstChild).toHaveClass('test');
  });

  it('works with arrays', () => {
    const Component = withTheme(({ ...rest }) => <div {...rest} />);
    const { container } = render(<Component theme={['primary']} />);

    expect(container.firstChild).toHaveClass('mdc-theme--primary');
  });

  it('handles deprecations', () => {
    const Component = withTheme(({ ...rest }) => <div {...rest} />);

    const { container: container1 } = render(<Component theme="primary foo" />);
    const { container: container2 } = render(<Component theme="on-primary" />);
    expect(container1).toMatchSnapshot();
    expect(container1.firstChild).toHaveClass('mdc-theme--primary foo');

    expect(container2).toMatchSnapshot();
    expect(container2.firstChild).toHaveClass('mdc-theme--on-primary');
  });
});
