Ext.ns('Surveypie');

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
            canvas_height = body_height - body.getPadding('tb');

        body.setHeight(body_height);

        if (this.canvas) this.canvas.remove();

        var tick = body.createChild({
                tag: 'canvas',
                width: body.getWidth(),
                height: canvas_height
            }),
            canvas = tick.dom,
            tick_count = dict.count,
            tick_margin = 10,
            step = (canvas_height - tick_margin * 2) / (tick_count - 1);
        console.log('create tick');

        var box = tick.getPageBox();
        box.height = box.height - tick_margin * 2;
        box.top = box.top + tick_margin;
        box.bottom = box.bottom - tick_margin;

        this.canvas = tick;
        this.tick_pagebox = box;

        
        if (canvas.getContext) {
            var ctx = canvas.getContext("2d");
            ctx.fillStyle = "#dddddd";
            ctx.strokeStyle = '#f00';
            for (var i = 0, n = tick_count; i < n; i++) {
                ctx.beginPath();
                ctx.arc(25/2, tick_margin + i * step, 6, 0, Math.PI*2,true); // Outer circle;
                //ctx.stroke();
                ctx.fill();
                ctx.closePath();
                //ctx.moveTo(0, 0);
            }
        }
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
    }
});

Ext.reg('sp_index_scroller', Surveypie.IndexScroller);

// Ext.regModel('IndexBarModel', {
//     fields: ['key', 'value']
// });
