# ember-rollback-relationships
[![Build Status](https://api.travis-ci.org/dylanmensaert/ember-rollback-relationships.png)](https://travis-ci.org/dylanmensaert/ember-rollback-relationships)
[![Code Climate](https://codeclimate.com/github/dylanmensaert/ember-rollback-relationships.png)](https://codeclimate.com/github/dylanmensaert/ember-rollback-relationships)
[![Dependency Status](https://www.versioneye.com/user/projects/55c2641f653762002000287d/badge.svg?style=flat)](https://www.versioneye.com/user/projects/59cbd0032de28c00382c93b2)

`ember install ember-rollback-relationships`

Adds behaviour to [DS.Model](http://emberjs.com/api/data/classes/DS.Model.html) so belongsTo **relationships** are also rolled back when `model.rollbackAttributes()` is called.

This addon works without having to write additional code.

Calling `this._super();` is required if you are using any of the following Events:
- ready
- didCreate
- didLoad
- didUpdate

API
---

### getChangedRelationships()

Returns an `object` containing the changed relationships by `name` (key) and `id` (value).

```js
let foo = this.store.createRecord('foo');

console.assert({}, foo.getChangedRelationships());
```
