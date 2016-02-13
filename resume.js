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

  var init = function() {
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
    var transformations = [];
    ['h1', '.phone', '.email'].forEach(function(selector, i) {
      transformations.push(getTransformation(
        elems.header.querySelector(selector),
        elems.compressedHeader.querySelector(selector),
        !i
      ));
    });
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
    // setTimeout(function() {
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
          if (!tr.scale && innerWidth < 668) ['phone', 'email'].forEach(function(name) {
            elems[name].style.opacity = 1 - distance;
          });
        });
        elems.compressedHeader.style.opacity = Math.pow(distance, 0.5);
        elems.shadow.style.opacity = Math.pow(distance, 4);
        ticking = false;
      };
      var onScroll = function() {
        if (ticking || scrollY > 100 && transformComplete)
          return;
        ticking = true;
        requestAnimationFrame(update);
      };
      onScroll();
      window.addEventListener('scroll', onScroll);
    // }, 10);
  });

  if (window.innerWidth < 500) {
    var widths = {};
    ['phone', 'email'].forEach(function(className) {
      widths[className] = getComputedStyle(elems.header.querySelector('.' + className + ' a')).width;    
    });
    var toggleExpanded = function(evt) {
      var link = this.parentNode.getElementsByTagName('a')[0];
      var width = widths[this.parentNode.classList.contains('phone') ? 'phone': 'email'];
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
      /*if (expanded && expanded!==link) {
        expanded.classList.remove(className);
        expanded.style.width = '';
      }
      var isExpanded = link.classList.toggle(className);
      elems.compressedHeader.classList.toggle(className,  isExpanded);
      if (isExpanded) link.style.width = widths['phone'];*/
    };
    [].forEach.call(elems.compressedHeader.getElementsByTagName('svg'), function(elem) {
      elem.addEventListener('click', toggleExpanded);
    });
  } else if (toggleExpanded) {
    toggleExpanded = null;
    [].forEach.call(elems.compressedHeader.getElementsByTagName('svg'), function(elem) {
      elem.removeEventListener('click', toggleExpanded);
    });
  }

})();
