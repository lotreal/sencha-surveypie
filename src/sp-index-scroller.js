Ext.ns('Surveypie');

var Ticks = Ext.extend(Object, {
    margin: 10,
    ticks: {},
    tick_height: 16,
    last_highlight: -1,

    indicator : {
        el: null,
        style: {
            ani_start: {
                "fill-opacity": 0.2, 
                "stroke-opacity": 0.2
            },
            ani_end: {
                "r": 8,
                "fill-opacity": 0.6, 
                "fill": "#666666",
                "stroke": "orange", 
                "stroke-width": 4,
                "stroke-opacity": 1
            },
            ani_during: 300
        }
    },

    constructor: function(config) {
        var me = this;
        Ext.apply(me, config);
    },

    setPaper: function(paper, width, height) {
        if (paper) paper.setSize(width, height);
        else paper =  Raphael(this.container, width, height);

        this.paper = paper;
        this.width = width;
        this.height = height;
        return this.paper;
    },

    highlightTick: function(index) {
        index = index < 0 ? 0 : index;
        var it = this.indicator.el, 
            style = this.indicator.style,
            cy = this.ticks[index].y;

        it.attr(style.ani_start);
        it.attr({cy: cy});
        it.animate(style.ani_end, this.ani_during);

        this.last_highlight = index;
        console.log('highlightTick', this.ticks[index].y, index);
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

    drawTicks: function(width, height, num) {
        var paper = this.setPaper(this.paper, width, height);
        paper.clear();

        this.step = (height - this.margin * 2) / (num - 1);

        var kk = parseInt(this.tick_height / this.step) * 2;

        console.log('tick step = ', this.step);

        var x = this.width / 2, y, ticks = [];
        for (var i = 0, n = num; i < n; i++) {
            y = this.margin + i * this.step;
            ticks.push({x:x, y:y});
        }

        var it = paper.circle(ticks[0].x, ticks[0].y, 5);
        it.attr(this.indicator.style.ani_end);
        this.indicator.el = it;

        for (var j = 0, k = ticks.length; j < k; j++) {
            var t = ticks[j];
            if (kk > 0 && j % kk !== 0) {
                if (j == k-1) {
                    var ttt = paper.circle(t.x, t.y, 3);
                    ttt.attr({fill: '#666666'});
                    t.el = ttt;
                } else {
                    t.el = null;
                }
            } else {
                t.el = this.makeNormal(paper.text(t.x, t.y, j + 1));
            }
        }

        this.ticks = ticks;
        console.log('calc tick', ticks, this.last_highlight);
        this.highlightTick(this.last_highlight);
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
            tap: this.onTouchMove,
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



        var tick_count = dict.count,
            tick_margin = 10,
            step = (canvas_height - tick_margin * 2) / (tick_count - 1);

        var box = body.getPageBox();
        box.height = box.height - tick_margin * 2;
        box.top = box.top + tick_margin;
        box.bottom = box.bottom - tick_margin;

        this.tick_pagebox = box;
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
