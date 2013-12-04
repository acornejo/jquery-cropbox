(function() {
  // helper functions
  function is_touch_device() {
    return 'ontouchstart' in window || // works on most browsers 
           'onmsgesturechange' in window; // works on ie10
  }

  function fill(value, target, container) {
    if (value + target < container) 
      value = container - target;
    return value > 0 ? 0 : value;
  }

  function uri2blob(dataURI) {
      var uriComponents = dataURI.split(',');
      var byteString = atob(uriComponents[1]);
      var mimeString = uriComponents[0].split(':')[1].split(';')[0];
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
      this.image_src = null;
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

        this.$image.on('load.' + pluginName, function() {
          var image_src = self.$image.attr('src');
          if (self.image_src === image_src)
            return;
          self.image_src = image_src;
          self.width = this.width;
          self.height = this.height;
          self.percent = undefined;
          self.$image.fadeIn('fast');
          self.fit();
          self.update();
        }).prop('draggable', false).each(function () {
          if (this.complete) $(this).trigger('load');
        });

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
                startX: parseInt(self.$image.css('left'), 10),
                startY: parseInt(self.$image.css('top'), 10)
              };
            dragData.dx = e.gesture.deltaX;
            dragData.dy = e.gesture.deltaY;
            e.gesture.preventDefault();
            e.gesture.stopPropagation();
            self.drag.call(self, dragData, true);
          }).on('release', function(e) {
            e.gesture.preventDefault();
            dragData = null;
            self.update.call(self);
          }).on('doubletap', function(e) {
            e.gesture.preventDefault();
            self.zoomIn.call(self);
          }).on('pinchin', function (e) {
            e.gesture.preventDefault();
            self.zoomIn.call(self);
          }).on('pinchout', function (e) {
            e.gesture.preventDefault();
            self.zoomOut.call(self);
          });
        } else {
          this.$image.on('mousedown.' + pluginName, function(e1) {
            var dragData = {
              startX: parseInt(self.$image.css('left'), 10),
              startY: parseInt(self.$image.css('top'), 10)
            };
            e1.preventDefault(); 
            $(document).on('mousemove.' + pluginName, function (e2) {
              dragData.dx = e2.pageX - e1.pageX;
              dragData.dy = e2.pageY - e1.pageY;
              self.drag.call(self, dragData, true);
            }).on('mouseup.' + pluginName, function() {
              self.update.call(self);
              $(document).off('.' + pluginName);
            });
          });
        }
        if ($.fn.mousewheel) {
          this.$image.on('mousewheel.' + pluginName, function (e) {
            e.preventDefault();
            if (e.deltaY < 0)
              self.zoomIn.call(self);
            else
              self.zoomOut.call(self);
          });
        }
      },

      remove: function () {
        var hammerit;
        if (typeof $.fn.hammer === 'function')
          hammerit = this.$image.hammer();
        else if (typeof Hammer !== 'undefined')
          hammerit = Hammer(this.$image.get(0));
        if (hammerit)
          hammerit.off('mousedown dragleft dragright dragup dragdown release doubletap pinchin pinchout');
        this.$image.off('.' + pluginName);
        this.$image.css({width: '', left: '', top: ''});
        this.$image.removeClass('cropImage');
        this.$image.removeData('cropbox');
        this.$image.insertAfter(this.$frame);
        this.$frame.removeClass('cropFrame');
        this.$frame.removeAttr('style');
        this.$frame.empty();
        this.$frame.hide();
      },

      fit: function () {
        var widthRatio = this.options.width / this.width, heightRatio = this.options.height / this.height;
        if (widthRatio >= heightRatio)
          this.minPercent = this.width < this.options.width ? this.options.width / this.width : widthRatio;
        else
          this.minPercent = this.height < this.options.height ? this.options.height / this.height : heightRatio;
        this.zoom(this.minPercent);
      },

      zoom: function(percent) {
        this.percent = Math.max(this.minPercent, Math.min(1, percent));
        this.$image.width(Math.ceil(this.width * this.percent));
        this.$image.css({
          left: fill(Math.round((this.options.width - this.$image.width())/2), this.$image.width, this.options.width),
          top: fill(Math.round((this.options.height - this.$image.height())/2), this.$image.height, this.options.height)
        });
        this.update();
      },
      zoomIn: function() {
        this.zoom(this.percent + (1 - this.minPercent) / (this.options.zoom - 1 || 1));
      },
      zoomOut: function() {
        this.zoom(this.percent - (1 - this.minPercent) / (this.options.zoom - 1 || 1));
      },
      drag: function(data, skipupdate) {
        this.$image.css({
          left: fill(data.startX + data.dx, this.$image.width(), this.options.width),
          top: fill(data.startY + data.dy, this.$image.height(), this.options.height)
        });
        if (skipupdate)
          this.update();
      },
      update: function() {
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

        var ctx = canvas.getContext('2d');
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
          inst.fit();
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
