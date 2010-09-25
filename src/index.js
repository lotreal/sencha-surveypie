Ext.ns('Surveypie', 'Surveypie.ui', 'Surveypie.data');

Ext.regModel('Surveypie', {
    fields: ['id', 'subject', 'require', 'intro', 'form']
});

Ext.regModel('Part', {
    fields: ['type', 'sn', 'parent_sn', '', '', '', 'subject', 'require', 'intro', 'form']
});

Surveypie.data.Bridge = function(define) {
    var parts = define.parts, parts_array = [];
    for (sn in parts) {
        parts_array.push(parts[sn]);
    }
};

Surveypie.data.Bridge(response);

Surveypie.data.PartStore = new Ext.data.Store({
    model: 'Surveypie',
    // sorters: 'firstName',
    getGroupString : function(record) {
        return record.get('sn');
    },
    data: [
        part1,
        part2,
        part3,
        {sn: '5', subject: '请你打分', require: true, intro: '请认真填写', html: matrix }
    ]
});


Surveypie.ui.Page = new Ext.Panel({
    layout: Ext.is.Phone || true ? 'fit' : {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    },
    cls: 'demo-list',
    items: [{
        width: 300,
        height: 500,
        xtype: 'sp_list',
        store: Surveypie.data.PartStore,
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
    }]
});

Surveypie.ui.Main = Ext.extend(Ext.Panel, {
    fullscreen: true,
    layout: 'card',
    items: [{
        html: 'loading...'
    }],
    initComponent : function() {
        this.submitButton = new Ext.Button({
            text: 'Submit ',
            ui: 'forward',
            scope: this
        });


        var btns = [{xtype: 'spacer'}, this.submitButton];

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
        Surveypie.ui.Main.superclass.initComponent.call(this);
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
        this.ui = new Surveypie.ui.Main({
            title: Ext.is.Phone ? 'Surveypie' : 'Kitchen Surveypie'
        });
    }
};

Ext.setup({
    tabletStartupScreen: 'resources/img/tablet_startup.png',
    phoneStartupScreen: 'resources/img/phone_startup.png',
    icon: 'resources/img/icon.png',
    glossOnIcon: false,
    
    onReady: function() {
        Surveypie.Main.init();
        Surveypie.Main.ui.onListChange(Surveypie.Main.ui.navigationPanel, {text: 'Surveys: About this surveys is very very very funny. XD', card: Surveypie.ui.Page});
    }
});
