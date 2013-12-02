(function() {
  // helper functions
  function is_touch_device() {
    return 'ontouchstart' in window // works on most browsers 
        || 'onmsgesturechange' in window; // works on ie10
  }

  function fill(value, target, container) {
    if (value + target < container) 
      value = container - target;
    return value > 0 ? 0 : value;
  }

  function uri2blob(dataURI) {
      var uriComponents = dataURI.split(',');
      var byteString = atob(uriComponents[1]);
      var mimeString = uriComponents[0].split(':')[1].split(';')[0]
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for (var i = 0; i < byteString.length; i++)
          ia[i] = byteString.charCodeAt(i);
      return new Blob([ab], { type: mimeString });
  }

	var pluginName = 'cropbox';

  function factory($) {
    function Crop($image, options) {
      this.width = null;
      this.height = null;
      this.minPercent = null;
      this.options = options;
      this.$image = $image;
      this.$image.hide().addClass('cropImage').wrap('<div class="cropFrame" />'); // wrap image in frame;
      this.$frame = this.$image.parent();
      this.init();
    }

    Crop.prototype = {
      init: function () {
        var self = this;

        if (is_touch_device())
          this.$frame.addClass('hover');
        else
          this.$frame.hover(function () { self.$frame.toggleClass('hover'); });

        var defaultControls = $('<div/>', { 'class' : 'cropControls' })
              .append($('<span>Drag to crop</span>'))
              .append($('<a/>', { 'class' : 'cropZoomIn' }).on('click', $.proxy(this.zoomIn, this)))
              .append($('<a/>', { 'class' : 'cropZoomOut' }).on('click', $.proxy(this.zoomOut, this)));

        this.$frame.width(self.options.width).height(self.options.height);
        this.$frame.append(this.options.controls || defaultControls);

        this.$image.on('load', function() {
          self.width = this.width;
          self.height = this.height;
          self.focal = { x: Math.round(self.width / 2) ,y: Math.round(self.height / 2) };
          self.computeMinPercent();
          self.$image.fadeIn('fast'); //display image now that it has loaded
          self.update();
        }).prop('draggable', false).attr('src', self.$image.attr('src'));

        if (typeof $.fn.hammer === 'function' || typeof Hammer !== 'undefined') {
          var hammerit, dragData;
          if (typeof $.fn.hammer === 'function')
            hammerit = this.$image.hammer();
          else
            hammerit = Hammer(this.$image.get(0));

          hammerit.on('mousedown', function(e) {
            e.preventDefault(); // this prevents firefox's default image dragging
            e.stopPropagation();
          }).on("dragleft dragright dragup dragdown", function(e) {
            if (!dragData)
              dragData = {
                imgX: parseInt(self.$image.css('left'), 10),
                imgY: parseInt(self.$image.css('top'), 10)
              };
            dragData.dx = e.gesture.deltaX;
            dragData.dy = e.gesture.deltaY;
            e.gesture.preventDefault();
            e.gesture.stopPropagation();
            self.drag.call(self, dragData);
          }).on('release', function(e) {
            e.gesture.preventDefault();
            dragData = null;
            self.update.call(self);
          }).on('doubletap', function(e) {
            e.gesture.preventDefault();
            self.zoomIn.call(self);
          }).on('pinchin', function (e) {
            e.gesture.preventDefault();
            self.zoom.call(self, self.percent - e.gesture.scale / 110);
          }).on('pinchout', function (e) {
            e.gesture.preventDefault();
            self.zoom.call(self, self.percent + (e.gesture.scale - 1) / 110);
          });
        } else {
          this.$image.on('mousedown.' + pluginName, function(e1) {
            var dragData = {
              imgX: parseInt(self.$image.css('left'), 10),
              imgY: parseInt(self.$image.css('top'), 10)
            };
            e1.preventDefault(); 
            $(document).on('mousemove.' + pluginName, function (e2) {
              dragData.dx = e2.pageX - e1.pageX;
              dragData.dy = e2.pageY - e1.pageY;
              self.drag.call(self, dragData);
            }).on('mouseup.' + pluginName, function() {
              $(document).off('.' + pluginName);
            });
          });
        }
        if ($.fn.mousewheel) {
          this.$image.on('mousewheel', function (e) {
            e.preventDefault();
            if (e.deltaY < 0)
              self.zoomIn.call(self);
            else
              self.zoomOut.call(self);
          });
        }
      },

      computeMinPercent: function () {
        var widthRatio = this.options.width / this.width, heightRatio = this.options.height / this.height;
        if (widthRatio >= heightRatio)
          this.minPercent = this.width < this.options.width ? this.options.width / this.width : widthRatio;
        else
          this.minPercent = this.height < this.options.height ? this.options.height / this.height : heightRatio;
        this.zoom(this.percent || this.minPercent);
      },

      zoom: function(percent) {
        this.percent = Math.max(this.minPercent, Math.min(1, percent));
        this.$image.width(Math.ceil(this.width * this.percent));
        this.$image.css({
          left: fill(-Math.round(this.focal.x * this.percent - this.options.width / 2), this.$image.width(), this.options.width),
          top: fill(-Math.round(this.focal.y * this.percent - this.options.height / 2), this.$image.height(), this.options.height)
        });
      },
      zoomIn: function() {
        this.zoom(this.percent + (1 - this.minPercent) / (this.options.zoom - 1 || 1));
        this.update();
      },
      zoomOut: function() {
        this.zoom(this.percent - (1 - this.minPercent) / (this.options.zoom - 1 || 1));
        this.update();
      },
      drag: function(data) {
        this.$image.css({
          left: fill(data.imgX + data.dx, this.$image.width(), this.options.width),
          top: fill(data.imgY + data.dy, this.$image.height(), this.options.height)
        });
      },
      update: function() {
        this.focal = {
          x: Math.round((this.options.width / 2 - parseInt(this.$image.css('left'), 10)) / this.percent),
          y: Math.round((this.options.height / 2 - parseInt(this.$image.css ('top'), 10)) / this.percent)
        };
        this.result = {
          cropX: -Math.floor(parseInt(this.$image.css('left'), 10) / this.percent),
          cropY: -Math.floor(parseInt(this.$image.css('top'), 10) / this.percent),
          cropW: Math.round(this.options.width / this.percent),
          cropH: Math.round(this.options.height / this.percent),
          stretch: this.minPercent > 1
        };

        this.$image.trigger(pluginName, [this.result, this]);
      },
      getDataURI: function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.options.width;
        canvas.height = this.options.height;

        var ctx = canvas.getContext('2d')
        ctx.drawImage(this.$image.get(0), this.result.cropX, this.result.cropY, this.result.cropW, this.result.cropH, 0, 0, this.options.width, this.options.height);

        return canvas.toDataURL();
      },
      getBlob: function () {
        return uri2blob(this.getDataURI());
      },
    };

    $.fn[pluginName] = function(options) {
      return this.each(function() {
        var inst = $.data(this, pluginName);
        if (!inst) {
          var opts = $.extend({}, $.fn[pluginName].defaultOptions, options);
          $.data(this, pluginName, new Crop($(this), opts));
        } else if (options) {
          $.extend(inst.options, options);
          inst.computeMinPercent();
        }
      });
    };

    $.fn[pluginName].defaultOptions = {
      width: 200,
      height: 200,
      zoom: 10,
      controls: null
    };
  }

  if (typeof require === "function" && typeof exports === "object" && typeof module === "object") 
      factory(require("jquery"));
  else if (typeof define === "function" && define.amd) 
      define(["jquery"], factory);
  else
      factory(window.jQuery || window.Zepto);

})();
