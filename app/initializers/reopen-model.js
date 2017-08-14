import DS from 'ember-data';

export default {
    name: 'reopen-model',
    initialize: function() {
        DS.Model.reopen({
            oldBelongsTo: null,
            oldHasMany: null,
            resetOldRelationships: function() {
                let oldBelongsTo = {};
                this.set('oldHasMany', {});
                Ember.run.schedule('actions', this, function() {
                    this.eachRelationship(function(name, descriptor) {

                        if (descriptor.kind === 'belongsTo') {
                            let id = this.belongsTo(name).id();

                            if (!id) {
                                id = null;
                            }

                            oldBelongsTo[name] = id;
                        }
                        if (descriptor.kind === 'hasMany') {
                            this.hasMany(name).load().then((entities)=> {
                                if (entities && entities.length) {
                                    const oldHasMany = this.get("oldHasMany");
                                    oldHasMany[name] = entities.map(model=>model.id);
                                    this.set('oldHasMany', oldHasMany);
                                }
                            });
                        }
                    }, this);
                    this.set('oldBelongsTo', oldBelongsTo);
                    
                });
            },
            hasChangedRelationships: function() {
                const changedRelationships = this.getChangedRelationships();
                for (let prop in changedRelationships) {
                    if (changedRelationships[prop]) {
                        if (!changedRelationships[prop].hasOwnProperty("length") || changedRelationships[prop].length>0)
                        return true;
                    }
                }
                return false;
            },
            getChangedRelationships: function() {
                let oldBelongsTo = this.get('oldBelongsTo'),
                    oldHasMany = this.get('oldHasMany'),
                    changedRelationships = {};

                this.eachRelationship(function(name, descriptor) {
                    if (descriptor.kind === 'belongsTo') {
                        let id = this.belongsTo(name).id();

                        if (oldBelongsTo[name] !== id) {
                            changedRelationships[name] = id;
                        }
                    }
                    if (descriptor.kind === 'hasMany' && this.hasMany(name).value()) {
                        let ids = this.hasMany(name).value().map(model=>model.id);
                        if (!oldHasMany[name]) {
                            changedRelationships[name] = ids;
                        } else {
                            changedRelationships[name] = ids.filter(id=>oldHasMany[name].indexOf(id)===-1).concat(oldHasMany[name].filter(id=>ids.indexOf(id)===-1));
                        }
                    }
                }, this);

                return changedRelationships;
            },
            ready: function() {
                this.resetOldRelationships();
            },
            didCreate: function() {
                this.resetOldRelationships();
            },
            didLoad: function() {
                this.resetOldRelationships();
            },
            didUpdate: function() {
                this.resetOldRelationships();
            },
            rollbackAttributes: function() {
                let oldBelongsTo = this.get('oldBelongsTo');
                let oldHasMany = this.get('oldHasMany');
                this.eachRelationship(function(name, descriptor) {
                    if (descriptor.kind === 'belongsTo') {
                        let id = oldBelongsTo[name],
                            value = id;

                        if (id) {
                            let record = this.store.peekRecord(descriptor.type, id);

                            if (record) {
                                value = record;
                            }
                        }

                        this.set(name, value);
                    }
                    if (descriptor.kind === 'hasMany') {
                        let ids = oldHasMany[name];
                        if (ids) {
                            this.set(name, ids.filter(id=>id!=null).map(id=> this.store.peekRecord(descriptor.type, id)));
                        }
                    }
                }, this);

                this.resetOldRelationships();

                this._super();
            }
        });
    }
}
