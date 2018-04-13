# ember-rollback-relationships
[![Build Status](https://api.travis-ci.org/dylanmensaert/ember-rollback-relationships.png)](https://travis-ci.org/dylanmensaert/ember-rollback-relationships)
[![Code Climate](https://codeclimate.com/github/dylanmensaert/ember-rollback-relationships.png)](https://codeclimate.com/github/dylanmensaert/ember-rollback-relationships)
[![Dependency Status](https://www.versioneye.com/user/projects/59cbd0032de28c00382c93b2/badge.svg?style=flat)](https://www.versioneye.com/user/projects/59cbd0032de28c00382c93b2)

`ember install ember-rollback-relationships`

Adds behaviour to [DS.Model](http://emberjs.com/api/data/classes/DS.Model.html) so belongsTo and hasMany **relationships** can also be rolled back. Don't forget to call `model.rollbackAttributes()` yourself.

This addon works without having to write additional code.

Calling `this._super();` is required if you are using any of the following Events:
- ready
- didCreate
- didLoad
- didUpdate

API
---

### rollbackRelationships(kind)

Performs a rollback on the current model for every relation that meets the given criteria.
Possible values for `kind` are restricted to: ``, `belongsTo` and `hasMany`.

```js
// app/models/blog.js
export default DS.Model.extend({
  user: DS.belongsTo()
});

// app/models/post.js
export default DS.Model.extend({
  user: DS.belongsTo()
});

// app/models/user.js
export default DS.Model.extend({
  blogs: DS.hasMany(),
  posts: DS.hasMany()
});

// Rollback blogs and posts (all relationships)
user.rollbackRelationships();

// Rollback user (all belongsTo relationships)
blog.rollbackRelationships('belongsTo');

// Rollback blogs and posts (all hasMany relationships)
user.rollbackRelationships('hasMany');
```

### rollbackRelationship(name)

Performs a rollback of the given relationship name on the current model.
Possible values for `name` are determined by your relationships defined via: `DS.belongsTo` and `DS.hasMany`

```js
// app/models/blog.js
export default DS.Model.extend({
  user: DS.belongsTo()
});

// app/models/post.js
export default DS.Model.extend({
  user: DS.belongsTo()
});

// app/models/user.js
export default DS.Model.extend({
  blogs: DS.hasMany(),
  posts: DS.hasMany()
});

// Rollback user only
blog.rollbackRelationship('user');

// Rollback blogs only
user.rollbackRelationship('blogs');
```

