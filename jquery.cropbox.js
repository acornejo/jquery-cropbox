(function($) {
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

	var pluginName = 'cropbox';

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
        var widthRatio = self.options.width / self.width, heightRatio = self.options.height / self.height;
        if (widthRatio >= heightRatio)
          self.minPercent = self.width < self.options.width ? self.options.width / self.width : widthRatio;
        else
          self.minPercent = self.height < self.options.height ? self.options.height / self.height : heightRatio;
        self.zoom(self.minPercent);
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
              imgWidth: self.$image.width(),
              imgHeight: self.$image.height(),
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
            imgY: parseInt(self.$image.css('top'), 10),
            imgWidth: self.$image.width(),
            imgHeight: self.$image.height()
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
				left: fill(data.imgX + data.dx, data.imgWidth, this.options.width),
				top: fill(data.imgY + data.dy, data.imgHeight, this.options.height)
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

			this.$image.trigger(pluginName, this.result);
		}
	};

	$.fn[pluginName] = function(options) {
    return this.each(function() {
      if (!$.data(this, pluginName)) {
        var opts = $.extend($.fn[pluginName].defaultOptions, options);
        $.data(this, pluginName, new Crop($(this), opts));
      }
    });
	};

	$.fn[pluginName].defaultOptions = {
		width: 200,
		height: 200,
		zoom: 10,
		controls: null
	};
})(jQuery);
