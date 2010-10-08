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

        this.parts = this.el.select('.part');
        this.nums = this.el.select('.part-num');

        this.groups = this.el.select('.x-list-group');
        console.log('groups', this.groups);

        console.log('el', this, this.el);
        this.el.on('click', function(e, t) {
            if (!(/input/i.test(t.tagName))) return;

            var target = Ext.get(t),
                part = target.parent('.part');

            if (part && part.hasClass('select')) {
                var option_sn = target.id;
                this.survey.triggering(option_sn);
            }

            // this.ui2.updateGuideButton();
        }, this);

        this.survey.addListener('changeVisibility', function(part) {
            if (part.type !== 'page') {
                var el = Ext.get(part.sn);
                el.setStyle('display', part.visibility ? '' : 'none');
                this.updateOffsets();
                this.setPartNumber();
            }
        }, this);

        this.setPartNumber();
    },

    showPart: function(sn) {
        var type = this.survey.getPartType(sn);
        if (type == 'page') {
            this.survey.getPage(sn).visibility = true;
        } else {
            var part = Ext.get(sn);
            part.setStyle('display', '');
        }
    },

    setPartNumber: function() {
        var sn = 1;
        this.parts.each(function(el, c, idx) {
            if (el.getStyle('display') != 'none') {
                this.nums.item(idx).setHTML((sn++) + '. ');
            }
        }, this);
    },

    // afterLayout : function() {
    //     Ext.List.superclass.afterLayout.apply(this, arguments);
    //     this.updateOffsets();
    // },

    // as parent
    updateOffsets : function() {
        if (this.grouped) {
            this.groupOffsets = [];

            var headers = this.body.query('h3.question-subject'),
                ln = headers.length,
                header, i;

            for (i = 0; i < ln; i++) {
                header = Ext.get(headers[i]);
                header.setDisplayMode(Ext.Element.VISIBILITY);
                var top = header.dom.offsetTop;
                if (i > 0 && top == 0) continue;
                this.groupOffsets.push({
                    header: header,
                    offset: top
                });
            }

            console.log('offsets', this.groupOffsets);
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
            itemTpl = this.itemTpl;

        this.store.each(function(record) {
            results.push({
                group: record.get('subject'),
                sn: record.get('sn'),
                type: record.get('type'),
                subject: record.get('subject'),
                items: itemTpl.apply(record.data),
                visibility: record.get('visibility')
            });
        });
        return results;
    }
});

Ext.reg('sp_list', Surveypie.List);
