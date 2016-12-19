`ember install ember-rollback-relationships`

Adds behaviour to [DS.Model](http://emberjs.com/api/data/classes/DS.Model.html) so **relationships** are also rollbacked when `model.rollbackAttributes()` is called.

This addon works without any extra implementation requirements.

Calling `this._super();` is required if you are using any of the following Events:
- didCreate
- didLoad
- didUpdate
