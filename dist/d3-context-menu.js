(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-selection')) :
typeof define === 'function' && define.amd ? define(['exports', 'd3-selection'], factory) :
(global = global || self, factory(global.d3 = global.d3 || {}, global.d3));
}(this, function (exports, d3) { 'use strict';

function noop() {}
/**
 * @param {*} value
 * @returns {Boolean}
 */

function isFn(value) {
  return typeof value === 'function';
}
/**
 * @param {*} value
 * @returns {Function}
 */

function toFactory(value, fallback) {
  value = value === undefined ? fallback : value;
  return isFn(value) ? value : function () {
    return value;
  };
}

var d3ContextMenu = null; // event cache for d3-context-menu

var eventCache = null;

var closeMenu = function closeMenu() {
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


var d3ContextMenu$1 = (function (menuItems, config) {
  // allow for `d3.contextMenu('close');` calls
  // to programatically close the menu
  if (menuItems === 'close') {
    return closeMenu();
  } // for convenience, make `menuItems` a factory
  // and `config` an object


  menuItems = toFactory(menuItems);

  if (isFn(config)) {
    config = {
      onOpen: config
    };
  } else {
    config = config || {};
  } // resolve config


  var openCallback = config.onOpen || noop;
  var closeCallback = config.onClose || noop;
  var positionFactory = toFactory(config.position);
  var themeFactory = toFactory(config.theme, 'd3-context-menu-theme');
  /**
   * Context menu event handler
   * @param {*} data
   * @param {Number} index
   */

  return function (data, index) {
    var element = this; // close any menu that's already opened

    closeMenu(); // store close callback already bound to the correct args and scope

    d3ContextMenu = {
      boundCloseCallback: closeCallback.bind(element, data, index)
    }; // store contextmenu event;

    eventCache = d3.event; // create the div element that will hold the context menu

    d3.selectAll('.d3-context-menu').data([1]).enter().append('div').attr('class', 'd3-context-menu ' + themeFactory.bind(element)(data, index)); // close menu on mousedown outside

    d3.select('body').on('mousedown.d3-context-menu', closeMenu, true);
    d3.selectAll('.d3-context-menu').on('contextmenu', function () {
      closeMenu();
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }).append('ul').call(createNestedMenu, element); // the openCallback allows an action to fire before the menu is displayed
    // an example usage would be closing a tooltip

    if (openCallback.bind(element)(data, index) === false) {
      return;
    } // get position


    var position = positionFactory.bind(element)(data, index); // display context menu

    d3.select('.d3-context-menu').style('left', (position ? position.left : d3.event.pageX - 2) + 'px').style('top', (position ? position.top : d3.event.pageY - 2) + 'px').style('display', 'block');
    d3.event.preventDefault();
    d3.event.stopPropagation();

    function createNestedMenu(parent, root) {
      var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      var resolve = function resolve(value) {
        return toFactory(value).call(root, data, index, eventCache);
      };

      var listItems = parent.selectAll('li').data(function (d) {
        var baseData = depth === 0 ? menuItems : d.children;
        return resolve(baseData);
      }).enter().append('li').each(function (d) {
        // get value of each data
        var isDivider = !!resolve(d.divider);
        var disabled = !!resolve(d.disabled);
        var hasChildren = !!resolve(d.children);
        var hasAction = !!d.action;
        var title = resolve(d.title);
        var listItem = d3.select(this).classed('is-divider', isDivider).classed('is-disabled', disabled).classed('is-header', !hasChildren && !hasAction).classed('is-parent', hasChildren).html(isDivider ? '<hr>' : title).on('click', function () {
          // do nothing if disabled or no action
          if (disabled || !hasAction) return;
          d.action.call(root, data, index, eventCache);
          closeMenu();
        });

        if (hasChildren) {
          // create children(`next parent`) and call recursive
          var children = listItem.append('ul').classed('is-children', true);
          createNestedMenu(children, root, ++depth);
        }
      });
    }
  };
});

exports.contextMenu = d3ContextMenu$1;

Object.defineProperty(exports, '__esModule', { value: true });

}));
