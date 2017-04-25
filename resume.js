(function() {
  'use strict';

  var cssToNum = function(css) {
    if (!css) return;
    var index = css.search(/[a-zA-Z]/),
        number = css.substr(0, index) * 1,
        comma = css.indexOf(',');
    if (comma===-1) comma = undefined;
    var unit = css.substring(index, comma);
    if (unit==='s') number *= 1000;
    else if (unit.indexOf('em')!==-1)
      return number * cssToNum(getComputedStyle(document.documentElement).fontSize);
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
  document.body.appendChild(elems.compressedHeader);

  var getPosition = function(elem) {
    /*var range = document.createRange();
    range.selectNode(elem.childNodes[0]);*/
    var rect = /*range*/elem.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top
    };
  };

  var getTransformation = function(standard, compressed, shouldScale) {
    var position = getPosition(standard);
    var compressedPosition = getPosition(compressed);
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
    var mapPosition = getPosition(elems.map);
    elems.newMap.id = 'new-map';
    var mapStyle = {
      position: 'absolute',
      top: mapPosition.top + 'px',
      left: mapPosition.left + 'px'
    };
    for (var prop in mapStyle) elems.newMap.style[prop] = mapStyle[prop];
    if (!document.body.contains(elems.newMap)) document.body.appendChild(elems.newMap);
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
    if (window.innerWidth < 668) {
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


  new FontFaceObserver('Open Sans').check().then(function() {
    // detect touch to make hover elems visible
    if ('ontouchstart' in window) document.body.className = 'touch';

    var transformations = init();
    var ticking, transformComplete;
    var update = function() {
      var distance = Math.min(scrollY / 100, 1);
      transformComplete = distance===1;
      document.body.classList.toggle('compressed', transformComplete);
      transformations.forEach(function(tr) {
        tr.elem.style.transform = getTransformationCss(distance, tr);
        if (!tr.scale && innerWidth < 668) contactOpacity(1 - distance);
      });
      elems.compressedHeader.style.opacity = Math.pow(distance, 0.5);
      elems.shadow.style.opacity = Math.pow(distance, 4);
      ticking = false;
    };
    var onScroll = function() {
      if (ticking || scrollY > 100 && transformComplete) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    let throttleId;
    //basic throttle because I only use once and don't want dependencies
    window.addEventListener('resize', () => {
      if (throttleId) return;
      throttleId = setTimeout(() => {
        transformations = init();
        throttleId = null;
      }, 20);
    });
  });


})();
