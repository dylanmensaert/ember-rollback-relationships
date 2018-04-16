# ember-rollback-relationships

`ember install ember-rollback-relationships`

Adds behaviour to [DS.Model](http://emberjs.com/api/data/classes/DS.Model.html) so belongsTo and hasMany **relationships** can also be rolled back.

Notes
---

Don't forget to call `model.rollbackAttributes()` yourself if required.

Calling `this._super();` is mandatory if you are using any of the following Events:
- ready
- didCreate
- didLoad
- didUpdate

**Many-to-many** relationships are not supported!

API
---

### rollbackRelationships(`kind`)

Performs a rollback on the current model for every relationship that meets the given criteria.

`kind` *String* **belongsTo** and **hasMany**

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

### rollbackRelationship(`name`)

Performs a rollback on the current model for the given relationship only.

`name` *String* of the relationship

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

