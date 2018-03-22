import Ember from 'ember';
import DS from 'ember-data';

function getInverse(name) {
    let relationship = this.relationshipsByName.get(name),
        inverse = relationship.options.inverse;

    if (!inverse) {
        relationship.eachRelationship((name, descriptor) => {
            if (descriptor.kind !== relationship.kind && this.constructor.modelName === descriptor.type) {
                inverse = name;
            }
        });
    }

    return inverse;
}

function getOldHasManyIds(name, id) {
    let relationship = this.relationshipsByName.get(name),
        record = this.store.peekRecord(relationship.type, id),
        inverse = getInverse.call(this, name);

    if (!record.oldRelationshipIdByName[inverse]) {
        record.oldRelationshipIdByName[inverse] = [];
    }

    return record.oldRelationshipIdByName[inverse];
}

function commitBelongsTo(name) {
    let oldRelationshipIdByName = this.get('oldRelationshipIdByName'),
        oldId = oldRelationshipIdByName[name],
        id = this.belongsTo(name).id();

    if (oldId !== id) {
        if (oldId) {
            let oldHasManyIds = getOldHasManyIds.call(this, name, oldId);

            oldHasManyIds.splice(oldHasManyIds.indexOf(this.get('id')), 1);
        }

        if (id) {
            let oldHasManyIds = getOldHasManyIds.call(this, name, id);

            oldHasManyIds.push(this.get('id'));

            oldRelationshipIdByName[name] = id;
        } else {
            delete oldRelationshipIdByName[name];
        }
    }
}

function commit() {
    Ember.run.schedule('actions', this, function () {
        this.eachRelationship((name, descriptor) => {
            if (descriptor.kind === 'belongsTo') {
                commitBelongsTo.call(this, name);
            }
        });
    });
}

export default {
    name: 'reopen-model',
    initialize: function () {
        DS.Model.reopen({
            oldRelationshipIdByName: {},
            changedRelationship: function (name) {
                let relationship = this.relationshipsByName.get(name);

                if (relationship.kind === 'belongsTo') {
                    let oldRelationshipIdByName = this.get('oldRelationshipIdByName'),
                        oldId = oldRelationshipIdByName[name];

                    if (oldId) {
                        let id = this.belongsTo(name).id();

                        if (oldId !== id) {
                            return [
                                oldId,
                                id
                            ];
                        }
                    }
                } else {
                    let oldHasManyIds = this.oldRelationshipIdByName[name],
                        hasManyIds = [];

                    this.get(name).forEach((child) => {
                        let id = child.get('id');

                        hasManyIds.push(id);
                    });

                    if (JSON.stringify(oldHasManyIds.sort()) !== JSON.stringify(hasManyIds.sort())) {
                        return [
                            oldHasManyIds,
                            hasManyIds
                        ];
                    }
                }
            },
            changedRelationships: function (kind) {
                let changedRelationships = {};

                this.eachRelationship((name, descriptor) => {
                    if (!kind || descriptor.kind === kind) {
                        changedRelationships[name] = this.changedRelationship(name);
                    }
                });

                return changedRelationships;
            },
            rollbackRelationship: function (name) {
                let relationship = this.relationshipsByName.get(name);

                if (relationship.kind === 'belongsTo') {
                    let oldRelationshipIdByName = this.get('oldRelationshipIdByName'),
                        id = oldRelationshipIdByName[name],
                        value = id;

                    if (id) {
                        let relationship = this.relationshipsByName.get(name),
                            record = this.store.peekRecord(relationship.type, id);

                        if (record) {
                            value = record;
                        }
                    }

                    this.set(name, value);
                    commitBelongsTo.call(this, name);
                } else {
                    let changedRelationship = this.changedRelationship(name);

                    if (changedRelationship) {
                        let changedHasManyIds = new Set(changedRelationship[0]),
                            inverse = getInverse.call(this, name);

                        changedRelationship[1].forEach(function (id) {
                            changedHasManyIds.add(id);
                        });

                        changedHasManyIds.forEach(function (recordId) {
                            let relationship = this.relationshipsByName.get(name),
                                record = this.store.peekRecord(relationship.type, recordId);

                            record.rollbackRelationship(inverse);
                        });
                    }
                }
            },
            rollbackRelationships: function (kind) {
                this.eachRelationship((name, descriptor) => {
                    if (!kind || descriptor.kind === kind) {
                        this.rollbackRelationship(name);
                    }
                });
            },
            ready: function () {
                commit.call(this);
            },
            didCreate: function () {
                commit.call(this);
            },
            didLoad: function () {
                commit.call(this);
            },
            didUpdate: function () {
                commit.call(this);
            }
        });
    }
}
