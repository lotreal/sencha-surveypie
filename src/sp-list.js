Ext.ns('Surveypie');

Surveypie.List = Ext.extend(Ext.List, {
    // @private
    initComponent : function() {
        if (this.indexer) {
            this.indexBar = false;
            this.indexStore = new Ext.data.Store({
                fields: ['count'],
                data : [
                    {count: this.store.getCount()}
                ]
            });

            var indexerConfig = Ext.apply(
                {}, 
                Ext.isObject(this.indexer) ? this.indexer : {}, {
                    xtype: 'indexbar',
                    dock: 'right',
                    overlay: true,
                    alphabet: true,
                    store: this.indexStore
                });

            this.indexer = Ext.ComponentMgr.create(indexerConfig);
            console.log('create indexer', this.indexer);
            if (this.dockedItems) {
                this.addDocked(this.indexer);
            } else {
                this.dockedItems = [];
                this.dockedItems.push(this.indexer);
            }

            this.cls = this.cls || '';
            this.cls += ' x-list-indexed';
        } else if (this.scroll) {
            this.scroll.scrollbars = true;
        }

        Surveypie.List.superclass.initComponent.call(this);
    },

    // @private
    afterRender : function() {
        Surveypie.List.superclass.afterRender.call(this);

        var parts = this.el.query('.form-element');
        Ext.each(parts, function(part) {
            new Ext.util.Scroller(part, {vertical: false, horizontal: true});
        });
    },

    // @private
    initEvents : function() {
        Surveypie.List.superclass.initEvents.call(this);

        if (this.grouped) {
            if (this.indexer) {
                this.mon(this.indexer, {
                    index: this.onIndex,
                    scope: this
                });
            }
        }
    },

    // @private
    onIndex : function(sn, percent) {
        if (this.current_gourp_sn == sn) return;
        closest = this.body.down('.x-group-' + sn);
        if (closest) {
            try {
                this.scroller.scrollTo({x: 0, y: closest.getOffsetsTo(this.scrollEl)[1]}, false, null, true);
                this.current_gourp_sn = sn;
                console.log('scroll', sn);
            } catch (e) {};
        }
    },

    getGroupId : function(group) {
        return group.name[0];
    }
});

Ext.reg('sp_list', Surveypie.List);
