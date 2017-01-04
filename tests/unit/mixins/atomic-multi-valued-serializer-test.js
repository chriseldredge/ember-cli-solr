import Ember from 'ember';

import {
  moduleFor,
  test
} from 'ember-qunit';

import DS from 'ember-data';
import MultiValuedTransform from 'ember-solr/transforms/multi-valued';
import SolrUpdateMode from 'ember-solr/lib/update-mode';

moduleFor('serializer:atomic-multi-valued', 'AtomicMultiValuedSerializerMixin', {
  needs: ['model:atomic'],
  beforeEach: function() {
    var container = this.container;
    this.register('store:main', DS.Store);
    this.register('transform:string', DS.StringTransform);
    this.register('transform:strings', MultiValuedTransform);
    this.register('transform:boolean', DS.BooleanTransform);
    this.register('transform:number', DS.NumberTransform);

    this.createRecord = function(type, options) {
      return Ember.run(function() {
        options = options || {};
        return container.lookup('store:main').push({
          data: {
            id: options.id,
            type: 'atomic',
            attributes: options
          }
        });
      });
    };

    this.store = this.container.lookup('store:main');
  }
});

test('serialize: array deep equal with different order not included', function(assert) {
  var oldAttrs = {id: 'atom-1', categories: Ember.A(['a', 'b'])};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('title', 'new title');
    record.set('categories', Ember.A(['b', 'a']));
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', title: {set: 'new title'}});
});

test('serialize: atomic add single item replacing array', function(assert) {
  var oldAttrs = {id: 'atom-1', categories: Ember.A(['a'])};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('categories', Ember.A(['a', 'b']));
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', categories: {add: 'b'}});
});

// not supported by DS; see: https://github.com/emberjs/data/issues/2825
/*
test('serialize: atomic add single item to array with pushObject', function(assert) {
  var oldAttrs = {id: 'atom-1', categories: Ember.A(['a'])};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.get('categories').pushObject('b');
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', categories: {add: 'b'}});
});
*/

// TODO: test previousValue is 'a' and new value is ['a', 'b']
// TODO: test previousValue is null and new value is 'a'
// TODO: test previousValue is 'a' and new value is null
// TODO: test previousValue is ['a', 'b'] and new value is 'c';

test('serialize: atomic add', function(assert) {
  var oldAttrs = {id: 'atom-1', categories: Ember.A(['a', 'b', 'c'])};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('categories', Ember.A(['c', 'd', 'e']));
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', categories: {add: ['d', 'e'], remove: ['a', 'b']}});
});

