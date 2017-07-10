Backbone.emulateJSON = true;
Tabula.SavedTemplate = Backbone.Model.extend({
  // templates.push({"name": "fake test template", "selection_count": 0, "page_count": 0, "time": "1499535056", "id": "asdfasdf"})
  name: null,
  page_count: null,
  selection_count: null,
  id: null,
  time: 0,
  url: "templates",
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
