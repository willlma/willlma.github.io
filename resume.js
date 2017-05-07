(function() {
  'use strict';

  const { body, documentElement } = document;
  const scrollDistance = 100;
  const mobileWidth = 668;

  var cssToNum = function(css) {
    if (!css) return;
    var index = css.search(/[a-zA-Z]/),
        number = css.substr(0, index) * 1,
        comma = css.indexOf(',');
    if (comma===-1) comma = undefined;
    var unit = css.substring(index, comma);
    if (unit==='s') number *= 1000;
    else if (unit.indexOf('em')!==-1)
      return number * cssToNum(getComputedStyle(documentElement).fontSize);
    return number;
  };

  var elems = {
    main: document.getElementsByTagName('main')[0],
    aside: document.getElementsByTagName('aside')[0],
    header: document.getElementsByTagName('header')[0],
    shadow: document.getElementById('shadow')
  };
  elems.name = elems.header.getElementsByTagName('h1')[0];
  elems.details = elems.header.getElementsByTagName('ul')[0];
  elems.map = elems.header.getElementsByClassName('map')[0];
  elems.newMap = elems.map.cloneNode(true);
  elems.phone = elems.header.querySelector('.phone a');
  elems.email = elems.header.querySelector('.email a');
  elems.compressedHeader = elems.header.cloneNode(true);
  elems.compressedHeader.className = 'compressed';

  var getTransformation = function(standard, compressed, shouldScale) {
    var position = standard.getBoundingClientRect();
    var compressedPosition = compressed.getBoundingClientRect();
    var result = {
      elem: standard,
      x: position.left - compressedPosition.left,
      y: position.top - compressedPosition.top
    };
    if (shouldScale)
      result.scale = cssToNum(getComputedStyle(compressed).fontSize) /
        cssToNum(getComputedStyle(standard).fontSize);
    return result;
  };

  function placeMap() {
    var mapPosition = elems.map.getBoundingClientRect();
    elems.newMap.id = 'new-map';
    var mapStyle = {
      position: 'absolute',
      top: mapPosition.top + 'px',
      left: mapPosition.left + 'px'
    };
    for (var prop in mapStyle) elems.newMap.style[prop] = mapStyle[prop];
    if (!body.contains(elems.newMap)) body.appendChild(elems.newMap);
    elems.map.style.visibility = 'hidden';
  }

  function toggleExpanded(parent, widths) {
    var link = parent.getElementsByTagName('a')[0];
    var width = widths[parent.classList.contains('phone') ? 'phone': 'email'];
    var cs = 'contact-shown';
    var expanded = elems.compressedHeader.getElementsByClassName(cs)[0];
    if (expanded) {
      if (expanded===link) {
        link.classList.remove(cs);
        elems.compressedHeader.classList.remove(cs);
        link.style.width = '';
      } else {
        link.classList.add(cs);
        link.style.width = width;
        expanded.classList.remove(cs);
        expanded.style.width = '';
      }
    } else {
      link.classList.add(cs);
      elems.compressedHeader.classList.add(cs);
      link.style.width = width;
    }
  };

  function contactInfoClickListeners() {
    if (window.innerWidth < mobileWidth) {
      var widths = {};
      ['phone', 'email'].forEach(function(className) {
        widths[className] = getComputedStyle(elems.header.querySelector('.' + className + ' a')).width;
      });
      [].forEach.call(elems.compressedHeader.getElementsByTagName('svg'), function(elem) {
        elem.onclick = ({ currentTarget }) => toggleExpanded(currentTarget.parentNode, widths);
      });
    } else {
      [].forEach.call(elems.compressedHeader.getElementsByTagName('svg'), function(elem) {
        elem.onclick = null;
      });
    }
  }

  function contactOpacity(opacity) {
    ['phone', 'email'].forEach(function(name) {
      elems[name].style.opacity = opacity;
    });
  }

  var init = function() {
    placeMap();
    var transformations = [];
    ['h1', '.phone', '.email'].forEach(function(selector, i) {
      transformations.push(getTransformation(
        elems.header.querySelector(selector),
        elems.compressedHeader.querySelector(selector),
        !i
      ));
    });
    contactInfoClickListeners();
    contactOpacity(1);
    return transformations;
  };

  var getTransformationCss = function(distance, tr) {
    var transform = 'translate3d(' + tr.x * -distance + 'px, '
      + tr.y * -distance + 'px, 0)';
    if (tr.scale) {
      var currentScale = 1 + (tr.scale - 1) * distance;
      transform += ' scale(' + currentScale + ')';
    }
    return transform;
  };

  let throttleId, transformations;
  //basic throttle because I only use once and don't want dependencies
  window.addEventListener('resize', () => {
    if (throttleId) return;
    throttleId = setTimeout(() => {
      transformations = init();
      throttleId = null;
    }, 100);
  });

  new FontFaceObserver('Open Sans').check().then(function() {
    if (documentElement.scrollHeight - innerHeight < scrollDistance) return;
    body.classList.remove('noscript');
    body.appendChild(elems.compressedHeader);
    // detect touch to make hover elems visible
    if ('ontouchstart' in window) body.classList.add('touch');

    transformations = init();
    var ticking, transformComplete;
    var update = function() {
      var distance = Math.min(scrollY / scrollDistance, 1);
      transformComplete = distance===1;
      body.classList.toggle('compressed', transformComplete);
      transformations.forEach(function(tr) {
        tr.elem.style.transform = getTransformationCss(distance, tr);
        if (!tr.scale && innerWidth < mobileWidth) contactOpacity(1 - distance);
      });
      elems.compressedHeader.style.opacity = Math.pow(distance, 0.5);
      elems.shadow.style.opacity = Math.pow(distance, 4);
      ticking = false;
    };
    var onScroll = function() {
      if (ticking || scrollY > scrollDistance && transformComplete) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
  });


})();
