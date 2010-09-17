Ext.ns('Surveypie');

Surveypie.IndexScroller = Ext.extend(Ext.DataPanel, {
    cmpCls: 'x-indexscroller',
    direction: 'vertical',
    tpl: '',
    itemSelector: 'null',
    
    /**
     * @cfg {Array} letters
     * The letters to show on the index bar. Defaults to the English alphabet, A-Z.
     */
    letters: ['1', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],

    // @private
    initComponent : function() {
        // No docking and no sizing of body!
        this.componentLayout = new Ext.layout.AutoComponentLayout();
        // this.componentLayout.setTargetSize(100, 100);

        if (!this.store) {
            this.store = new Ext.data.Store({
                model: 'IndexBarModel'
            });
        }

        if (this.alphabet == true) {
            this.ui = this.ui || 'alphabet';
        }

        if (this.direction == 'horizontal') {
            this.horizontal = true;
        }
        else {
            this.vertical = true;
        }

        this.addEvents('index');

        Surveypie.IndexScroller.superclass.initComponent.call(this);
    },

    // @private
    afterRender : function() {
        Surveypie.IndexScroller.superclass.afterRender.call(this);

        // if (this.alphabet === true) {
        //     this.loadAlphabet();
        // }

        if (this.vertical) {
            this.el.addClass(this.cmpCls + '-vertical');
        }
        else if (this.horizontal) {
            this.el.addClass(this.cmpCls + '-horizontal');
        }
    },

    initTicks: function() {
        if (this.tick_inited) return;
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
            tick_count = this.store.getAt(0).get('count'),
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
                ctx.arc(25/2, tick_margin + i * step, 3,0,Math.PI*2,true); // Outer circle;
                //ctx.stroke();
                ctx.fill();
                ctx.closePath();
                //ctx.moveTo(0, 0);
            }
        }

        this.tick_inited = false;
    },

    // @private
    afterLayout : function(layout) {
        Surveypie.IndexScroller.superclass.afterLayout.call(this, layout);
        this.initTicks();
    },

    refresh: function() {
        Surveypie.IndexScroller.superclass.refresh.call(this);
        // if (!this.layout.layedOut) return;
        // console.log(this.store.getAt(0).get('subject'));
    },

    // @private
    loadAlphabet : function() {
        var letters = this.letters,
            len = letters.length,
            data = [],
            i, letter;

        for (i = 0; i < len; i++) {
            letter = letters[i];
            data.push({key: letter.toLowerCase(), value: letter});
        }

        this.store.loadData(data);
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
            n = this.store.getAt(0).get('count') - 1,
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
        sn = Math.floor(( 2 * percent * n * n + n) / (2 * n)) + 1;
        console.log('index', sn, percent);
        me.fireEvent('index', sn, percent);
    }
});

Ext.reg('sp_index_scroller', Surveypie.IndexScroller);

// Ext.regModel('IndexBarModel', {
//     fields: ['key', 'value']
// });
