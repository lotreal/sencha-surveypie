Ext.ns('Surveypie');

var Ticks = Ext.extend(Object, {
    constructor: function(config) {
        var me = this;
        Ext.apply(me, config);

        this.margin = 10;
        this.ticks = {};
        this.tick_height = 16;
        this.last_highlight = -1;
    },

    getPaper: function() {
        if (!this.paper) this.paper = Raphael(this.container, width, height);
        else this.paper.setSize(width, height);

        this.paper.clear();
    },

    highlightTick: function(index) {
        console.log('highlight', this.ticks, this.last_highlight);
        if (this.last_highlight == index) return;
        if (this.last_highlight > 0) {
            var last_tick = this.ticks[this.last_highlight];
            if (last_tick) {
                last_tick.attr({
                    "fill": '#333333'
                });
                // last_tick.hide();
            }
        }

        var tick = this.ticks[index];
        if (tick) this.makeActive(tick);
        this.last_highlight = index;
    },

    makeActive: function(tick) {
        tick.attr({
            "fill": 'red'
        });
        return tick;
    },

    makeNormal: function(tick) {
        tick.attr({
            // "font-size": this.tick_height, 
            "font": 'Helvetica Neue',
            "font-family": "Helvetica Neue",
            "fill": "#333333"
        });
        return tick;
    },

    drawTick: function(index) {
        var k = parseInt(this.tick_height / this.step) * 2;
        if (k > 0 && index % k !== 0) return (this.ticks[index] = null);

        var x = this.width / 2,
            y = this.margin + index * this.step,
            t = this.paper.text(x, y, index + 1);

        return (this.ticks[index] = this.makeNormal(t));
    },

    drawTicks: function(width, height, num) {
        this.setSize(width, height);

        if (!this.paper) this.paper = Raphael(this.container, width, height);
        else this.paper.setSize(width, height);

        this.paper.clear();

        this.step = (height - this.margin * 2) / (num - 1);
        console.log('tick step = ', this.step);
        for (var i = 0, n = num; i < n; i++) {
            var t = this.drawTick(i);
        }
        this.highlightTick(1);
    },

    setSize: function(width, height) {
        this.width = width;
        this.height = height;
    }
});

Surveypie.IndexScroller = Ext.extend(Ext.Panel, {
    cmpCls: 'x-indexscroller',
    direction: 'vertical',
    tpl: '',
    itemSelector: 'null',

    // @private
    initComponent : function() {
        this.componentLayout = new Ext.layout.AutoComponentLayout();

        if (this.direction == 'horizontal') {
            this.horizontal = true;
        }
        else {
            this.vertical = true;
        }

        this.addEvents('index');
        this.on('updateIndex', this.updateIndexer);
        this.on('syncIndex', this.syncTick);
        Surveypie.IndexScroller.superclass.initComponent.call(this);
    },

    // @private
    afterRender : function() {
        Surveypie.IndexScroller.superclass.afterRender.call(this);

        if (this.vertical) {
            this.el.addClass(this.cmpCls + '-vertical');
        }
        else if (this.horizontal) {
            this.el.addClass(this.cmpCls + '-horizontal');
        }


        this.ticks = new Ticks({
            container: this.getTargetEl().dom
        });
        console.log('afterrender');
    },

    // @private
    initEvents : function() {
        Surveypie.IndexScroller.superclass.initEvents.call(this);
        this.mon(this.body, {
            touchstart: this.onTouchStart,
            touchend: this.onTouchEnd,
            touchmove: this.onTouchMove,
            scope: this
        });
    },

    afterLayout : function(layout) {
        Surveypie.IndexScroller.superclass.afterLayout.call(this, layout);
        if (this.indexDict) this.updateIndexer(this.indexDict);
    },

    updateIndexer: function(dict) {
        this.indexDict = dict;
        this.initTicks(dict);
        console.log('update indexer', dict.count);
    },

    initTicks: function(dict) {
        var body = this.getTargetEl(),
            body_margin = 25,
            body_height = this.el.getHeight() - body_margin * 2,
            canvas_width = body.getWidth(),
            canvas_height = body_height - body.getPadding('tb');

        body.setHeight(body_height);
        this.ticks.drawTicks(canvas_width, canvas_height, dict.count);


        // if (! this.paper) this.paper = Raphael(body.dom, canvas_width, canvas_height);
        // else this.paper.setSize(canvas_width, canvas_height);

        // var tick = body.createChild({
        //     tag: 'div',
        //     width: body.getWidth(),
        //     height: canvas_height
        // });

        var paper = this.paper,
            tick_count = dict.count,
            tick_margin = 10,
            step = (canvas_height - tick_margin * 2) / (tick_count - 1);

        // paper.clear();
        // console.log('create tick', 'body', body);

        var box = body.getPageBox();
        box.height = box.height - tick_margin * 2;
        box.top = box.top + tick_margin;
        box.bottom = box.bottom - tick_margin;

        this.tick_pagebox = box;


        // for (var i = 0, n = tick_count; i < n; i++) {
        //     var y = tick_margin + i * step;
        //     // var circle = paper.circle(12.5, tick_margin + i * step, 5);
        //     var t = paper.text(12.5, tick_margin + i * step, i+1);
        //     t.attr({
        //         "font-size":12, 
        //         "font-weight":1000,
        //         "fill": "#f00"
        //     });
        //     //t.attr("stroke", "#fff");
        // }
    },

    // @private
    onTouchStart : function(e, t) {
        console.log('on touch start');
        this.el.addClass(this.cmpCls + '-pressed');
        this.pageBox = this.body.getPageBox();
        this.onTouchMove(e);
    },

    // @private
    onTouchEnd : function(e, t) {
        this.el.removeClass(this.cmpCls + '-pressed');
    },

    // @private
    onTouchMove : function(e) {
        var me = this,
            n = this.indexDict.count - 1,
            pageBox = this.tick_pagebox,
            percent, sn;

        if (me.vertical) {
            if (e.pageY > pageBox.bottom || e.pageY < pageBox.top) {
                return;
            }
            percent = (e.pageY - pageBox.top) / (pageBox.height);
        }
        else if (me.horizontal) {
            if (e.pageX > pageBox.right || e.pageX < pageBox.left) {
                return;
            }
            percent = (e.pageX - pageBox.right) / (pageBox.width);
        }
        if (isNaN(percent)) return;

        sn = Math.floor(( 2 * percent * n * n + n) / (2 * n)) + 1;

        console.log('index', sn, n , this.indexDict, pageBox);
        me.fireEvent('index', sn, percent);
    },

    syncTick: function(ui, index) {
        console.log('sync tick', index);
        this.ticks.highlightTick(index);
    }
});

Ext.reg('sp_index_scroller', Surveypie.IndexScroller);

// Ext.regModel('IndexBarModel', {
//     fields: ['key', 'value']
// });
