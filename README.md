`ember install ember-rollback-relationships`

Adds behaviour to [DS.Model](http://emberjs.com/api/data/classes/DS.Model.html) so belongsTo **relationships** are also rolled back when `model.rollbackAttributes()` is called.

This addon works without having to write additional code.

Calling `this._super();` is required if you are using any of the following Events:
- ready
- didCreate
- didLoad
- didUpdate
