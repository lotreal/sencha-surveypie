Ext.ns('Surveypie', 'Surveypie.ui', 'Surveypie.model', 'Surveypie.layout');

// 翻译指定文字
function T(key) {
    var dict = window.dict || {};
    return dict.hasOwnProperty(key) ? dict[key] : key;
}


Surveypie.layout.FlowLayout = Ext.extend(Ext.layout.ContainerLayout, {
    extraCls: '',
    targetCls: '',
    type: 'flow',
    
    // @private
    onLayout : function() {
        Surveypie.layout.FlowLayout.superclass.onLayout.call(this);

        if (this.owner.items.length) {
            var box = this.getTargetBox();
            this.setItemBox(this.owner.items.get(0), box);
        }
    },

    getTargetBox : function() {
        var target = this.getTarget(),
            size = target.getSize(),
            padding = {
                left: target.getPadding('l'),
                right: target.getPadding('r'),
                top: target.getPadding('t'),
                bottom: target.getPadding('b')
            }, 
            border = {
                left: target.getBorderWidth('l'),
                right: target.getBorderWidth('r'),
                top: target.getBorderWidth('t'),
                bottom: target.getBorderWidth('b')
            };
            
        return {
            width: size.width- padding.left - padding.right - border.left - border.right,
            height: size.height - padding.top - padding.bottom - border.top - border.bottom + 1000,
            x: padding.left + border.left,
            y: padding.top + border.top
        };        
    },
    
    // @private
    setItemBox : function(item, box) {
        if (item && box.height > 0) {
            //box.width -= item.el.getMargin('lr');
            box.width = null;
            box.height -= item.el.getMargin('tb');
            item.setSize(box);
            item.setPosition(box);
            console.log('setItemBox', item, box, '=====================');
        }
    }
});

Ext.regLayout('flow', Surveypie.layout.FlowLayout);


Surveypie.forEach = function(obj, fn, scope) {
    for ( prop in obj ) {
        if ( obj.hasOwnProperty( prop ) && typeof obj[prop] !== "function" ) {
            if (fn.call(scope || obj, obj[prop], prop, obj) === false) {
                return prop;
            }
        }
    }
    return true;
};


Ext.regModel('Surveypie', {
    fields: ['sn', 'subject', 'is_require', 'intro', 'html', 'visibility']
});

// 调查表在内存里的数据模型，包括对 trigger 的处理
Surveypie.model.Survey = Ext.extend(Ext.util.Observable, {
    // save the trigger info
    runtime: {
        triggered: [],
        show_by_trigger: {},
        finish_by_trigger: []
    },
    current_page: -1,

    constructor: function(define) {
        this.parts = define.parts;
        this.triggers = define.triggers;
        this.structure = define.structure;
        this.title = define.title;

        this.parseDefine(define);
        
        this.addEvents({
            'showpart': true,
            'hidepart': true
        });
    },

    parseDefine: function(define) {
        var _parts = define.parts,
            _structure = define.structure,
            _pages = define.page,
            pages = [];

        for (page_sn in _pages) {
            var parts_of_page_sns = _structure[page_sn];
            var page = {'sn': page_sn, 'metadata': _parts[page_sn]},
                parts = [],
                parts_data = [];

            for (var i = 0, n = parts_of_page_sns.length; i < n; i++) {
                parts.push(_parts[parts_of_page_sns[i]]);
            }
            page.parts = parts;
            pages.push(page);
        }
        this.pages = pages;
        console.log('define', this, console);
    },

    getTitle: function() {
        return this.title;
    },

    getPart: function(sn) {
        var part = this.parts[sn];
        return part;
    },

    // 得到下一页的相关信息
    getNextPageIdx: function() {
        if (this.runtime.finish_by_trigger.length > 0) return -1;
        for (var i = this.current_page + 1, n = this.pages.length; i < n; i++) {
            var page = this.pages[i];
            console.log(this.parts[page.sn]);
            if (this.parts[page.sn].visibility) return i;
        }
        return -1;
    },

    hasNextPage: function() {
        console.log('next', this.getNextPageIdx());
        return this.getNextPageIdx() >= 0;
    },

    getNextPage: function() {
        console.log('next', this.getNextPageIdx());
        var next = this.getNextPageIdx();
        if (next >= 0) {
            this.current_page = next;
            return this.pages[next];
        }
        return null;
    },

    // 根据 structure, 得到指定 sn 的父节点 或 null
    getParent: function(sn) {
        var structure = this.structure;
        for (parent in structure) {
            var children = structure[parent];
            for (var i = 0, n = children.length; i < n; i++) {
                if (children[i] == sn) return parent;
            }
        }
        return null;
    },
    
    // return the sn of question
    getQuestion: function(sn) {
        var part = this.parts[sn], type = part.type;
        if (/page/i.test(type)) return false;
        if (/select_option/i.test(type)) return part.parent_sn;
        return sn;
    },

    getPartType: function(sn) {
        return this.parts[sn].type;
    },

    // 处理触发器
    getTrigger: function(sn) {
        var qsn = this.getQuestion(sn);
        if (!qsn) return false;
        var assoc = this.triggers.assoc,
            trigger = assoc.hasOwnProperty(qsn) ? assoc[qsn] : [];
        console.log('The trigger of qustion', qsn, this.getOverview(qsn), 'is', trigger);
        return trigger;
    },

    triggering: function(sn) {
        var triggers = this.getTrigger(sn);
        for (var i = 0, n = triggers.length; i < n; i++) {
            var trigger = triggers[i];
            this.doTrigger(sn, trigger);
        }
        console.log('this.runtime', this.runtime);
        Surveypie.forEach(this.runtime.show_by_trigger, function(triggered, sn) {
            if (triggered.length > 0) {
                this.setVisibility(sn, true);
            } else {
                this.setVisibility(sn, false);
            }
        }, this);

        this.fireEvent('finish');
    },

    doTrigger: function(sn, trigger) {
        if (trigger['do'] == 'show' && trigger['with'].length) {    // 显示关联问题
            var show_by_trigger = this.runtime.show_by_trigger;
            for (var j = 0, assoc_part; assoc_part = trigger['with'][j]; j++) {
                var option_sn = trigger['when'];
                if (!show_by_trigger[assoc_part]) show_by_trigger[assoc_part] = [];
                if (option_sn == sn) {
                    if (show_by_trigger[assoc_part].indexOf(option_sn) == -1)
                        show_by_trigger[assoc_part].push(option_sn);
                } else {
                    this.undoTrigger(option_sn, trigger);
                }
            }
        } else if (trigger['do'] == 'finish') {     // 结束调查表
            var finish_by_trigger = this.runtime.finish_by_trigger,
                option_sn = trigger['when'];
            if (option_sn == sn) {
                if (finish_by_trigger.indexOf(option_sn) == -1)
                    finish_by_trigger.push(option_sn);
            } else {
                this.undoTrigger(option_sn, trigger);
            }
        }
    },

    undoTrigger: function(sn, trigger) {
        console.log('undo trigger', sn, trigger);
        var show_by_trigger = this.runtime.show_by_trigger;
        if (trigger['do'] == 'show' && trigger['with'].length) {    // 显示关联问题
            for (var j = 0, assoc_part; assoc_part = trigger['with'][j]; j++) {
                if (show_by_trigger[assoc_part]) 
                    show_by_trigger[assoc_part].remove(sn);

                var triggers = this.getTrigger(assoc_part);
                for (var i = 0, n = triggers.length; i < n; i++) {
                    this.undoTrigger(triggers[i]['when'], triggers[i]);
                }

                //console.log('undo', triggers);
            }
        } else if (trigger['do'] == 'finish') {     // 结束调查表
            var finish_by_trigger = this.runtime.finish_by_trigger;
            finish_by_trigger.remove(sn);
        }
    },

    setVisibility: function(sn, visibility) {
        var part = this.parts[sn];
        if (part.visibility !== visibility) {
            part.visibility = visibility;
            console.log('set visibility', sn, this.getPartType(sn), visibility);
            this.fireEvent('changeVisibility', part);
        }
    },


    // debug info
    getOverview: function(sn) {
        var part = this.parts[sn];
        return [ part.subject || part.label || sn, '(', part.type, ')'].join('');
    }
});

var survey = new Surveypie.model.Survey(response);


Surveypie.ui.Page = Ext.extend(Ext.Panel, {
    layout: Ext.is.Phone || true ? 'flow' : {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    },
    scroll: false,
    cls: 'demo-list',
    items: [],

    // @private
    initComponent : function() {
        Surveypie.ui.Page.superclass.initComponent.call(this);
        this.add({
            width: 300,
            height: 500,
            xtype: 'sp_list',
            store: this.partStore,
            survey: this.survey,
            itemTpl: '<tpl for="."><div class="intro">{intro}</div><div class="part-form">{html}</div></tpl>',
            groupTpl : [
                '<tpl for=".">',
                '<div class="x-list-group part {type}" id="{sn}" <tpl if="!visibility">style="display:none;"</tpl>>',
                '<h3 class="x-list-header question-subject"><span class="part-num"></span>{subject}<tpl if="is_require"> *</tpl></h3>',
                '<div class="x-list-group-items">',
                '{items}',
                '</div>',
                '</div>',
                '</tpl>'
            ],
            itemSelector: 'h3',
            //singleSelect: true,
            grouped: true,
            indexer: {'xtype': 'sp_index_scroller'}
        });
    }
});

Surveypie.ui.Survey = Ext.extend(Ext.Panel, {
    fullscreen: true,
    layout: 'card',
    items: [{
        html: 'loading...'
    }],

    nextPageStr: 'Next',
    submitStr: 'Submit',
    metadata: null,

    initComponent : function() {
        this.guideButton = new Ext.Button({
            // text: 'Submit ',
            ui: 'forward',
            handler: this.onGuildButtonTap,
            scope: this
        });

        var submitConfig = {
            items: [{html: 'captcha'}]
        };
        this.submitPanel = new Ext.Panel(submitConfig);


        var btns = [{xtype: 'spacer'}, this.guideButton];

        this.navigationBar = new Ext.Toolbar({
            ui: 'dark',
            dock: 'top',
            title: this.survey.getTitle(),
            items: btns.concat(this.buttons || [])
        });
        
        this.dockedItems = this.dockedItems || [];
        this.dockedItems.unshift(this.navigationBar);
        
        Surveypie.ui.Survey.superclass.initComponent.call(this);

        this.survey.addListener('changeVisibility', function(part) {
            if (part.type == 'page') {
                this.updateGuideButton();
            }
        }, this);

        this.survey.addListener('finish', function(part) {
            this.updateGuideButton();
        }, this);
    },
    
    getPageUI: function(page) {
        var partStore = new Ext.data.Store({
            model: 'Surveypie',
            data: page.parts
        });
        console.log('getPageUI', page);
        var panel = new Surveypie.ui.Page({'partStore': partStore, 'survey': survey});
        return panel;
    },

    hasNextPage: function() {
        return this.survey.hasNextPage();
    },

    showNextPage: function() {
        // this.loading(true);
        var page = this.survey.getNextPage();
        this.setActiveItem(this.getPageUI(page));
        this.updateGuideButton();
        // this.loading(false);
    },

    updateGuideButton: function() {
        if (this.hasNextPage()) {
            this.guideButton.setText(this.nextPageStr);
        } else {
            this.guideButton.setText(this.submitStr);
        }
    },

    onGuildButtonTap: function() {
        if (this.hasNextPage()) {
            this.showNextPage();
        } else {
            this.onSubmit();
        }
    },

    onSubmit: function() {
        (new Ext.MessageBox()).show({
            title : 'Please enter code:',
            msg : '<img id="captcha_img" src="/survey/captcha?t=1286766312749">Click image to try another',
            buttons: Ext.MessageBox.OKCANCEL,
            fn: Ext.emptyFn,
            icon  : Ext.MessageBox.QUESTION,
            prompt: true
        });
    }, 

    loading: function(flag) {
        if (!this.popup) {
            this.popup = new Ext.Panel({
                floating: true,
                modal: true,
                centered: true,
                width: 300,
                styleHtmlContent: true,
                html: '<p>This is a modal, centered and floating panel. hideOnMaskTap is true by default so ' +
                    'we can tap anywhere outside the overlay to hide it.</p>',
                dockedItems: [{
                    dock: 'top',
                    xtype: 'toolbar',
                    title: 'Loading'
                }],
                scroll: 'vertical'
            });
        }
        if (flag) this.popup.show();
        else this.popup.hide('fade');
    }

});

Surveypie.Main = {
    init : function() {
        this.ui = new Surveypie.ui.Survey({survey: survey});
        this.ui.showNextPage();
    }
};

Ext.setup({
    tabletStartupScreen: 'resources/img/tablet_startup.png',
    phoneStartupScreen: 'resources/img/phone_startup.png',
    icon: 'resources/img/icon.png',
    glossOnIcon: false,
    fullscreen: false,
    onReady: function() {
        Surveypie.Main.init();
        return true; 
    },
    onReady1: function() {
        // Ext.stretchEl.remove();

        var ct = Ext.get(Ext.stretchEl).createChild({
            cls: 'sp-test-flow'
        });
        console.log(ct);
        ct.setHTML('<p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p><p>abc</p>');
        //Surveypie.Main.init();
    }
});
var kk = function() {
    return true;
};
Ext.onReady(kk);
