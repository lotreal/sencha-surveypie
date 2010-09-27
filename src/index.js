Ext.ns('Surveypie', 'Surveypie.ui', 'Surveypie.data');

Ext.regModel('Surveypie', {
    fields: ['sn', 'subject', 'is_require', 'intro', 'html']
});

Surveypie.data.Survey = Ext.extend(Object, {
    constructor: function(define) {
        this.parseDefine(define);
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
                    html = Ext.getDom(part_sn).innerHTML;
                part.html = html;
                parts.push(part);
            }
            page.parts = parts;
            page.visibility = _pages[page_sn];
            pages.push(page);
        }
        console.log('define', pages);
        this.pages = pages;
        Ext.getDom('survey_body').innerHTML = '';
    },

    getPage: function() {},

    hasNextPage: function() {
        return true;
    },

    getNextPage: function() {
        return this.pages[0];
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
            tpl: '<tpl for="."><div class="part"><div class="intro">{intro}</div><div class="form-element">{html}</div></div></tpl>',
            groupTpl : [
                '<tpl for=".">',
                '<div class="x-list-group x-group-{id}">',
                '<h3 class="x-list-header"><b class="x-list-group-sn"></b>{subject}</h3>',
                '<div class="x-list-group-items">',
                '{items}',
                '</div>',
                '</div>',
                '</tpl>'
            ],
            itemSelector: 'div.part',
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
            title: this.title,
            items: btns.concat(this.buttons || [])
        });
        
        this.dockedItems = this.dockedItems || [];
        this.dockedItems.unshift(this.navigationBar);
        
        this.addEvents('navigate');
        //console.log(this.navigationBar.titleEl);
        Surveypie.ui.Survey.superclass.initComponent.call(this);
    },
    
    getPageUI: function(page) {
        var partStore = new Ext.data.Store({
            model: 'Surveypie',
            // sorters: 'firstName',
            getGroupString : function(record) {
                return record.get('sn');
            },
            data: page.parts
        });
        console.log('xxx');
        var panel = new Surveypie.ui.Page({'partStore': partStore});
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
    },

    onListChange : function(list, item) {
        if (item.card) {
            this.setCard(item.card, item.animation || 'slide');
            this.currentCard = item.card;
            if (item.text) {
                this.navigationBar.setTitle(item.text);
            }
            if (Ext.is.Phone) {
                this.navigationBar.doLayout();
            }
        }     
       
        this.fireEvent('navigate', this, item, list);
    }
});

Surveypie.Main = {
    init : function() {
        this.ui = new Surveypie.ui.Survey({
            title: Ext.is.Phone ? 'Surveypie' : 'Kitchen Surveypie',
            survey: survey
        });
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
        
        // Surveypie.Main.ui.onListChange(Surveypie.Main.ui.navigationPanel, {text: 'Surveys: About this surveys is very very very funny. XD', card: Surveypie.ui.Page});
    }
});
