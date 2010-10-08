Ext.ns('Surveypie', 'Surveypie.ui', 'Surveypie.data');

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

Surveypie.data.Survey = Ext.extend(Ext.util.Observable, {
    constructor: function(define) {
        this.define = define;

        this.parts = define.parts;
        this.triggers = define.triggers;
        this.structure = define.structure;

        this.runtime = {
            triggered: [],
            show_by_trigger: {},
            finish_by_trigger: []
        };

        this.current_page = -1;
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
                var part_sn = parts_of_page_sns[i],
                    part = _parts[part_sn],
                    part_node = Ext.get(part_sn), 
                    html = part_node.getHTML(),
                    visibility = part_node.getStyle('display') !== 'none';

                part.html = html;
                part.visibility = visibility;
                parts.push(part);
            }
            page.parts = parts;
            // page.visibility = _pages[page_sn];
            this.parts[page_sn].visibility = _pages[page_sn];
            pages.push(page);
        }
        this.pages = pages;
        console.log('define', this);
        Ext.getDom('survey_body').innerHTML = '';
    },

    getTitle: function() {
        return this.define.title;
    },

    getPage: function(sn) {
        for (var i = 0, n = this.pages.length; i < n; i++) {
            var page = this.pages[i];
            if (page.sn == sn) return page;
        }
        return null;
    },

    getOverview: function(sn) {
        var part = this.parts[sn];
        return [ part.subject || part.label || sn, '(', part.type, ')'].join('');
    },

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
        return this.define.parts[sn].type;
    },

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
                    show_by_trigger[assoc_part].push(option_sn);
                } else {
                    this.undoTrigger(option_sn, trigger);
                }
            }
        } else if (trigger['do'] == 'finish') {     // 结束调查表
            var finish_by_trigger = this.runtime.finish_by_trigger,
                option_sn = trigger['when'];
            if (option_sn == sn) {
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
    }
});

var survey = new Surveypie.data.Survey(response);


Surveypie.ui.Page = Ext.extend(Ext.Panel, {
    layout: Ext.is.Phone || true ? 'fit' : {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    },
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
            tpl: '<tpl for="."><div class="intro">{intro}</div><div class="part-form">{html}</div></tpl>',
            groupTpl : [
                '<tpl for=".">',
                '<div class="x-list-group part {type}" id="{sn}" <tpl if="!visibility">style="display:none;"</tpl>>',
                '<h3 class="x-list-header question-subject"><b class="part-num"></b>{subject}</h3>',
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
        var page = this.survey.getNextPage();
        this.setCard(this.getPageUI(page));
        this.updateGuideButton();
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
    
    onReady: function() {
        Surveypie.Main.init();
    }
});
