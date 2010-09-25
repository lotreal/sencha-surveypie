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

        var sn = this.el.query('.x-list-group-sn');
        Ext.each(sn, function(el, index) {
            el.innerText = (index+1) + '.';
        });

        console.log('afterRender sp-list:', sn);
        this.groups = this.el.select('.x-list-group');
        console.log('groups', this.groups);
    },

    // afterLayout : function() {
    //     Ext.List.superclass.afterLayout.apply(this, arguments);
    //     this.updateOffsets();
    // },

    // as parent
    updateOffsets : function() {
        if (this.grouped) {
            this.groupOffsets = [];

            var headers = this.body.query('h3.x-list-header'),
                ln = headers.length,
                header, i;

            for (i = 0; i < ln; i++) {
                header = Ext.get(headers[i]);
                header.setDisplayMode(Ext.Element.VISIBILITY);
                this.groupOffsets.push({
                    header: header,
                    offset: header.dom.offsetTop
                });
            }
        }
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
        sn = sn - 1;
        if (this.current_gourp_sn == sn) return;
        closest = this.groups.item(sn);
        if (closest) {
            try {
                this.scroller.scrollTo({x: 0, y: closest.getOffsetsTo(this.scrollEl)[1]}, false, null, true);
                this.current_gourp_sn = sn;
                console.log('scroll', sn);
            } catch (e) {};
        }
    },

    getGroupId : function(group) {
        return group.name;
    },


    getGroupSubject: function(group) {
        console.log('getGroupSubject:group:', group);
        return group.children[0].subject;
    },

    setActiveGroup : function(group) {
        var _activeGroup = this.activeGroup;
        Surveypie.List.superclass.setActiveGroup.apply(this, arguments);
        if (group) {
            var active_idx = this.groups.indexOf(group.header.parent());
            if (this.grouped && this.indexer && _activeGroup == this.activeGroup)
                this.indexer.fireEvent('sync', this, active_idx);
        }
    },

    // @private
    collectData : function(records, startIndex) {
        if (!this.grouped) {
            return Surveypie.List.superclass.collectData.call(this, records, startIndex);
        }

        var results = [],
            groups = this.store.getGroups(),
            ln = groups.length,
            children, cln, c,
            group, i;

        for (i = 0, ln = groups.length; i < ln; i++) {
            group = groups[i];
            children = group.children;
            for (c = 0, cln = children.length; c < cln; c++) {
                children[c] = children[c].data;
            }
            results.push({
                group: group.name,
                id: this.getGroupId(group),
                subject: this.getGroupSubject(group),
                items: this.itemTpl.apply(children)
            });
        }

        return results;
    }
});

Ext.reg('sp_list', Surveypie.List);
