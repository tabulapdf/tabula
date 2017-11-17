Backbone.emulateJSON = true;
Tabula.SavedTemplate = Backbone.Model.extend({
  // templates.push({"name": "fake test template", "selection_count": 0, "page_count": 0, "time": "1499535056", "id": "asdfasdf"})
  name: null,
  page_count: null,
  selection_count: null,
  id: null,
  time: 0,
  urlRoot: "templates",
  initialize: function(){
    this.set('name', this.get('name') || null);
    this.set('page_count', this.get('page_count') || null)
    this.set('selection_count', this.get('selection_count') || null)
    this.set('id', this.get('id') || null)
    this.set('time', this.get('time') || null)
  }
});

Tabula.TemplatesCollection = Backbone.Collection.extend({
    model: Tabula.SavedTemplate,
    url: "templates",
    comparator: function(i){ return -i.get('time')}
});

Tabula.SavedTemplateView = Backbone.View.extend({
  tagName: 'tr',
  className: 'saved-template',
  events: {
    'click .delete-template': 'deleteTemplate',
    'click .download-template': 'downloadTemplate',
    'click .edit-template-name': 'editTemplateName',
    'click .save-template-name': 'renameTemplate'
  },
  template: _.template( $('#saved-template-library-item-template').html().replace(/nestedscript/g, 'script')),
  initialize: function(){
    _.bindAll(this, 'render', 'deleteTemplate', 'renameTemplate', 'editTemplateName');
  },
  render: function(){
    this.$el.append(this.template(this.model.attributes));
    this.$el.addClass('saved-template-id-' + this.model.get('id')); // more efficient lookups than data-attr
    this.$el.data('id', this.model.get('id')); //more cleanly accessed than a class
    return this;
  },
  editTemplateName: function(e) {
    var name_el = this.$el.find(".template-name");
    $(name_el).replaceWith($('<input type="text" value="'+this.model.get('name')+'">'));
    $(e.currentTarget).replaceWith($("<a href=\"javascript:\"><span class=\"glyphicon glyphicon-floppy-disk save-template-name\"></span></a>"));
  },
  renameTemplate: function(e){
    var input_el = $(e.currentTarget).closest("td").find("input");
    var new_name = input_el.val();
    this.model.set({'name': new_name});
    this.model.save();
    $(input_el).replaceWith($('<span class="template-name">'+this.model.get('name')+'</span>'));
    $(e.currentTarget).replaceWith($('<a href="javascript:"><span class="glyphicon glyphicon-pencil edit-template-name"></span></a>'));

  },
  downloadTemplate: function(e) {
    // no-op, this is handled old-school by a form element. No javascript, no jquery, certainly no backbone involved.
  },
  deleteTemplate: function(e) {
    var template_id = $(e.currentTarget).data("id");
    // var btn = $(e.currentTarget);
    // var tr = btn.parents('tr');

    // if (!confirm('Delete file "'+btn.data('filename')+'"?')) return;
    // var pdf_id = btn.data('pdfid');
    this.model.destroy({success: _.bind(function() {
            this.$el.fadeOut(200, function() { $(this).remove(); });
          }, this)});
    }
})



Tabula.TemplateLibrary = Backbone.View.extend({
    events: {
        "submit form#uploadtemplate": 'uploadTemplate',
    },

    initialize: function(){
      _.bindAll(this, 'uploadTemplate', 'renderTemplateLibrary');
      this.templates_collection = new Tabula.TemplatesCollection([]);
      this.templates_collection.fetch({silent: true, complete: _.bind(function(){ this.render(); }, this) });
      this.listenTo(this.templates_collection, 'add', this.renderTemplateLibrary);
      this.templates_collection.fetch() // {complete: _.bind(function(){ this.renderTemplateLibrary(); }, this)});
      this.render();
    },
    uploadTemplate: function(e){
      $(e.currentTarget).find('button').attr('disabled', 'disabled');

      var formdata = new FormData($('form#uploadtemplate')[0]);
      $.ajax({
          url: $('form#uploadtemplate').attr('action'),
          type: 'POST',
          success: _.bind(function (res) {
            $(e.currentTarget).find('button').removeAttr('disabled');
            $('form#uploadtemplate')[0].reset();
            this.templates_collection.fetch();
          }, this),
          error: _.bind(function(a,b,c){
            alert('error in uploading template!')
            console.log("error in uploading template",a,b,c);
            $(e.currentTarget).find('button').removeAttr('disabled');
          },this),
          data: formdata,

          cache: false,
          contentType: false,
          processData: false
      });
      e.preventDefault();
      return false; // don't actually submit the form
    },

    renderTemplateLibrary: function(added_model){
      console.log("renderTemplateLibrary", added_model);
      if(this.templates_collection.length > 0){
        $('#template-library-container').show();
        var templates_table = this.$el.find('#saved-templates-container')

        templates_table.empty();

        this.templates_collection.each(_.bind(function(template, i){
          var template_element = new Tabula.SavedTemplateView({model: template}).render().$el;
          if(added_model && added_model.get('id') == template.get('id')){
            template_element.addClass('flash');
          }
          templates_table.append(template_element);
        }, this));

        var table_for_sorting = $('#templateTable');
        if(table_for_sorting.hasClass("tablesorter")){
          table_for_sorting.trigger('update');
        }else{
         table_for_sorting.addClass('tablesorter');
         table_for_sorting.tablesorter( {
            headers: { 3: { sorter: "usLongDate" },  4: { sorter: false}, 5: {sorter: false} },
            sortList: [[3,1]]  // initial sort
            } );
        }
      }else{
        $('#template-library-container').hide();
      }
    },
    render: function(){
      $('#tabula-app').html();
      this.renderTemplateLibrary();
      return this;
    }
});