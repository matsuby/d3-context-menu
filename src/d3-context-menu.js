import * as d3 from 'd3-selection';

const utils = {
  noop: function() {},

  /**
   * @param {*} value
   * @returns {Boolean}
   */
  isFn(value) {
    return typeof value === 'function';
  },

  /**
   * @param {*} value
   * @returns {Function}
   */
  constant(value) {
    return () => {
      return value;
    };
  },

  /**
   * @param {Function|*} value
   * @param {*} [fallback]
   * @returns {Function}
   */
  toFactory(value, fallback) {
    value = (value === undefined) ? fallback : value;
    return utils.isFn(value) ? value : utils.constant(value);
  }
};

// global state for d3-context-menu
let d3ContextMenu = null;

const closeMenu = () => {
  // global state is populated if a menu is currently opened
  if (d3ContextMenu) {
    d3.select('.d3-context-menu').remove();
    d3.select('body').on('mousedown.d3-context-menu', null);
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
  menuItems = utils.toFactory(menuItems);

  if (utils.isFn(config)) {
    config = { onOpen: config };
  } else {
    config = config || {};
  }

  // resolve config
  const openCallback = config.onOpen || utils.noop;
  const closeCallback = config.onClose || utils.noop;
  const positionFactory = utils.toFactory(config.position);
  const themeFactory = utils.toFactory(config.theme, 'd3-context-menu-theme');

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

    const list = d3.selectAll('.d3-context-menu')
      .on('contextmenu', function() {
        closeMenu();
        d3.event.preventDefault();
        d3.event.stopPropagation();
      })
      .append('ul');

    list.selectAll('li')
      .data(menuItems.bind(element)(data, index))
      .enter()
      .append('li')
      .attr('class', function(d) {
        let ret = '';
        if (utils.toFactory(d.divider).bind(element)(data, index)) {
          ret += ' is-divider';
        }
        if (utils.toFactory(d.disabled).bind(element)(data, index)) {
          ret += ' is-disabled';
        }
        if (!d.action) {
          ret += ' is-header';
        }
        return ret;
      })
      .html(function(d) {
        if (utils.toFactory(d.divider).bind(element)(data, index)) {
          return '<hr>';
        }
        if (!d.title) {
          console.error('No title attribute set. Check the spelling of your options.');
        }
        return utils.toFactory(d.title).bind(element)(data, index);
      })
      .on('click', function(d, i) {
        if (utils.toFactory(d.disabled).bind(element)(data, index)) return; // do nothing if disabled
        if (!d.action) return; // headers have no "action"
        d.action.bind(element)(data, index);
        closeMenu();
      });

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
  };
};
