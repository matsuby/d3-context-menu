import * as d3 from 'd3-selection';
import {noop, isFn, toFactory} from './utils'

// global state for d3-context-menu
let d3ContextMenu = null;

const closeMenu = () => {
  // global state is populated if a menu is currently opened
  if (d3ContextMenu) {
    d3.select('.d3-context-menu').remove();
    d3.select('body').on('mousedown.d3-context-menu', null, true);
    d3ContextMenu.boundCloseCallback();
    d3ContextMenu = null;
  }
};

/**
 * Calls API method (e.g. `close`) or
 * returns handler function for the `contextmenu` event
 * @param {Function|Array|String} menuItems
 * @param {Function|Object} config
 * @returns {?Function}
 */
export default (menuItems, config) => {
  // allow for `d3.contextMenu('close');` calls
  // to programatically close the menu
  if (menuItems === 'close') {
    return closeMenu();
  }

  // for convenience, make `menuItems` a factory
  // and `config` an object
  menuItems = toFactory(menuItems);

  if (isFn(config)) {
    config = { onOpen: config };
  } else {
    config = config || {};
  }

  // resolve config
  const openCallback = config.onOpen || noop;
  const closeCallback = config.onClose || noop;
  const positionFactory = toFactory(config.position);
  const themeFactory = toFactory(config.theme, 'd3-context-menu-theme');

  /**
   * Context menu event handler
   * @param {*} data
   * @param {Number} index
   */
  return function(data, index) {
    const element = this;

    // close any menu that's already opened
    closeMenu();

    // store close callback already bound to the correct args and scope
    d3ContextMenu = {
      boundCloseCallback: closeCallback.bind(element, data, index)
    };

    // create the div element that will hold the context menu
    d3.selectAll('.d3-context-menu').data([1])
      .enter()
      .append('div')
      .attr('class', 'd3-context-menu ' + themeFactory.bind(element)(data, index));

    // close menu on mousedown outside
    d3.select('body').on('mousedown.d3-context-menu', closeMenu, true);

    d3.selectAll('.d3-context-menu')
      .on('contextmenu', function() {
        closeMenu();
        d3.event.preventDefault();
        d3.event.stopPropagation();
      })
      .append('ul')
      .call(createNestedMenu, element);

    // the openCallback allows an action to fire before the menu is displayed
    // an example usage would be closing a tooltip
    if (openCallback.bind(element)(data, index) === false) {
      return;
    }

    // get position
    const position = positionFactory.bind(element)(data, index);

    // display context menu
    d3.select('.d3-context-menu')
      .style('left', (position ? position.left : d3.event.pageX - 2) + 'px')
      .style('top', (position ? position.top : d3.event.pageY - 2) + 'px')
      .style('display', 'block');

    d3.event.preventDefault();
    d3.event.stopPropagation();


    function createNestedMenu(parent, root, depth = 0) {
      const resolve = value => toFactory(value).call(root, data, index);
      const listItems = parent.selectAll('li')
        .data(d => {
          const baseData = depth === 0 ? menuItems : d.children;
          return resolve(baseData);
        })
        .enter()
        .append('li')
        .each(function(d) {
          // get value of each data
          const isDivider = !!resolve(d.divider);
          const disabled = !!resolve(d.disabled);
          const hasChildren = !!resolve(d.children);
          const hasAction = !!d.action;
          const title = resolve(d.title);

          const listItem = d3.select(this)
            .classed('is-divider', isDivider)
            .classed('is-disabled', disabled)
            .classed('is-header', !hasChildren && !hasAction)
            .classed('is-parent', hasChildren)
            .html(isDivider ? '<hr>' : title)
            .on('click', () => {
              // do nothing if disabled or no action
              if (disabled || !hasAction) return;

              d.action.call(root, data, index);
              closeMenu();
            });

          if (hasChildren) {
            // create children(`next parent`) and call recursive
            const children = listItem.append('ul').classed('is-children', true);
            createNestedMenu(children, root, ++depth)
          }
        });
    }
  };
};
