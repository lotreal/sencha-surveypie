Ext.ns('sink', 'demos', 'Ext.ux');

Ext.regModel('Surveypie', {
    fields: ['id', 'subject', 'require', 'intro', 'form']
});

demos.ListStore = new Ext.data.Store({
    model: 'Surveypie',
    // sorters: 'firstName',
    getGroupString : function(record) {
        return record.get('id') + '. ' + record.get('subject');
    },
    data: [
        {id: '1', subject: '姓名', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'},
        {id: '2', subject: '姓名', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'},
        {id: '3', subject: '姓名', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'},
        {id: '4', subject: '姓名', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'},
        {id: '5', subject: '请你打分', require: true, intro: '请认真填写', form: matrix },
        {id: '6', subject: '你喜欢什么', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'},
        {id: '7', subject: '你喜欢什么', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'},
        {id: '8', subject: '你喜欢什么', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'},
        {id: '9', subject: '你喜欢什么', require: true, intro: '请输入你的中文名字', form: '<input type="text" />'}
    ]
});


demos.List = new Ext.Panel({
    layout: Ext.is.Phone ? 'fit' : {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    },
    cls: 'demo-list',
    items: [{
        width: 300,
        height: 500,
        xtype: 'sp_list',
        // disclosure: {
        //     scope: demos.ListStore,
        //     handler: function(record, btn, index) {
        //         alert('Disclose more info for ' + record.get('firstName'));
        //     }
        // },
        store: demos.ListStore,
        tpl: '<tpl for="."><div class="part"><div class="intro">{intro}</div><div class="form-element">{form}</div></div></tpl>',
        itemSelector: 'div.part',
        //singleSelect: true,
        grouped: true,
        indexer: {'xtype': 'sp_index_scroller'}
    }]
});

Ext.ux.UniversalUI = Ext.extend(Ext.Panel, {
    fullscreen: true,
    layout: 'card',
    items: [],
    initComponent : function() {
        this.navigationBar = new Ext.Toolbar({
            ui: 'dark',
            dock: 'top',
            title: this.title,
            items: [].concat(this.buttons || [])
        });
        
        this.dockedItems = this.dockedItems || [];
        this.dockedItems.unshift(this.navigationBar);
        
        this.addEvents('navigate');
        
        Ext.ux.UniversalUI.superclass.initComponent.call(this);
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

sink.Main = {
    init : function() {
        this.ui = new Ext.ux.UniversalUI({
            title: Ext.is.Phone ? 'Sink' : 'Kitchen Sink'
            //navigationItems: sink.Structure
        });
    }
};

Ext.setup({
    tabletStartupScreen: 'resources/img/tablet_startup.png',
    phoneStartupScreen: 'resources/img/phone_startup.png',
    icon: 'resources/img/icon.png',
    glossOnIcon: false,
    
    onReady: function() {
        sink.Main.init();
        sink.Main.ui.onListChange(sink.Main.ui.navigationPanel, {text: 'Surveys', card: demos.List});
    }
});
