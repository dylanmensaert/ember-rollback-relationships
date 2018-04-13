import Ember from 'ember';
import DS from 'ember-data';

let hasManyByBelongsToId = {};

function commitBelongsTo(name, relationship) {
    let belongsToIdByName = this.get('belongsToIdByName'),
        oldBelongsToId = belongsToIdByName[name],
        belongsToId = this.belongsTo(name).id();

    if (oldBelongsToId !== belongsToId) {
        if (oldBelongsToId) {
            let inverse = this.getInverse(name);

            if (inverse) {
                let inverseHasMany = hasManyByBelongsToId[oldBelongsToId];

                inverseHasMany[inverse].delete(this);
            }
        }

        if (belongsToId) {
            let inverse = this.getInverse(name);

            if (inverse) {
                let hasManyByName;

                if (!hasManyByBelongsToId[belongsToId]) {
                    hasManyByBelongsToId[belongsToId] = {};
                }

                hasManyByName = hasManyByBelongsToId[belongsToId];

                if (!hasManyByName[inverse]) {
                    hasManyByName[inverse] = new Set();
                }

                belongsToIdByName[name] = belongsToId;

                hasManyByName[inverse].add(this);
            }
        } else {
            delete belongsToIdByName[name];
        }
    }
}

function commit() {
    Ember.run.schedule('actions', this, function() {
        this.eachRelationship((name, descriptor) => {
            if (descriptor.kind === 'belongsTo') {
                commitBelongsTo.call(this, name, descriptor);
            }
        });
    });
}

export default {
    name: 'reopen-model',
    initialize: function() {
        DS.Model.reopen({
            init: function() {
                this._super();

                this.set('belongsToIdByName', {});
            },
            belongsToIdByName: null,
            getRelationship: function(name) {
                let relationship;

                this.eachRelationship((relationshipName, descriptor) => {
                    if (name === relationshipName) {
                        relationship = descriptor;
                    }
                });

                return relationship;
            },
            getInverse: function(name) {
                let relationship = this.getRelationship(name),
                    inverse = relationship.options.inverse;

                if (!inverse) {
                    this.belongsTo(name).belongsToRelationship.inverseRecord.eachRelationship((name, descriptor) => {
                        if (descriptor.kind !== relationship.kind && this.constructor.modelName === descriptor.type) {
                            inverse = name;
                        }
                    });
                }

                return inverse;
            },
            rollbackRelationship: function(name) {
                let relationship = this.getRelationship(name);

                if (relationship.kind === 'belongsTo') {
                    let belongsToIdByName = this.get('belongsToIdByName'),
                        id = belongsToIdByName[name],
                        value = id;

                    if (id) {
                        let record = this.store.peekRecord(relationship.type, id);

                        if (record) {
                            value = record;
                        }
                    }

                    this.set(name, value);
                } else {
                    let hasManyByName = hasManyByBelongsToId[this.get('id')],
                        hasMany = new Set(hasManyByName[name]);

                    if (hasMany) {
                        let inverse = this.getInverse(name);

                        this.get(name).forEach((child) => {
                            hasMany.add(child);
                        });

                        hasMany.forEach((record) => {
                            record.rollbackRelationship(inverse);
                        });
                    }
                }
            },
            rollbackRelationships: function(kind) {
                this.eachRelationship((name, descriptor) => {
                    if (!kind || descriptor.kind === kind) {
                        this.rollbackRelationship(name);
                    }
                });
            },
            ready: function() {
                commit.call(this);
            },
            didCreate: function() {
                commit.call(this);
            },
            didLoad: function() {
                commit.call(this);
            },
            didUpdate: function() {
                commit.call(this);
            }
        });
    }
}
