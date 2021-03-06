import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LoadingCard from './LoadingCard';
import { diskMapper } from './dataMapper';
import { PencilAltIcon } from '@patternfly/react-icons';
import { propertiesSelector } from './selectors';
import { editDisplayName, editAnsibleHost, loadEntity } from './redux/actions';
import TextInputModal from './TextInputModal';

class SystemCard extends Component {
    state = {
        isDisplayNameModalOpen: false,
        isAnsibleHostModalOpen: false
    };

    onCancel = () => {
        this.setState({
            isDisplayNameModalOpen: false,
            isAnsibleHostModalOpen: false
        });
    };

    onSubmit = (fn) => (value) => {
        const { entity } = this.props;
        fn(entity.id, value);
        this.onCancel();
    }

    onShowDisplayModal = (event) => {
        event.preventDefault();
        this.setState({
            isDisplayNameModalOpen: true
        });
    };

    onShowAnsibleModal = (event) => {
        event.preventDefault();
        this.setState({
            isAnsibleHostModalOpen: true
        });
    };

    getAnsibleHost = () => {
        const { entity } = this.props;
        return entity.ansible_host || entity.fqdn || entity.id;
    };

    render() {
        const { detailLoaded, entity, properties, handleClick, setDisplayName, setAnsibleHost } = this.props;
        const { isDisplayNameModalOpen, isAnsibleHostModalOpen } = this.state;
        return (
            <Fragment>
                <LoadingCard
                    title="System properties"
                    isLoading={ !detailLoaded }
                    items={ [
                        {
                            title: 'Host name', value: entity.fqdn, size: 'md'
                        },
                        {
                            title: 'Display name', value: (
                                <Fragment>
                                    { entity.display_name }
                                    <a
                                        className="ins-c-inventory__detail--action"
                                        href={ `${window.location.href}/display_name` }
                                        onClick={ this.onShowDisplayModal }
                                    >
                                        <PencilAltIcon />
                                    </a>
                                </Fragment>
                            ), size: 'md'
                        },
                        {
                            title: 'Ansible hostname', value: (
                                <Fragment>
                                    { this.getAnsibleHost() }
                                    <a
                                        className="ins-c-inventory__detail--action"
                                        href={ `${window.location.href}/ansible_name` }
                                        onClick={ this.onShowAnsibleModal }
                                    >
                                        <PencilAltIcon />
                                    </a>
                                </Fragment>
                            ), size: 'md'
                        },
                        { title: 'Number of CPUs', value: properties.cpuNumber },
                        { title: 'Sockets', value: properties.sockets },
                        { title: 'Cores per socket', value: properties.coresPerSocket },
                        { title: 'RAM', value: properties.ramSize },
                        {
                            title: 'Storage',
                            value: properties.storage ? `${properties.storage.length} disks` : 0,
                            target: 'storage',
                            onClick: () => {
                                handleClick('Storage', diskMapper(properties.storage));
                            }
                        }
                    ] }
                />
                <TextInputModal
                    isOpen={ isDisplayNameModalOpen }
                    title='Edit name'
                    value={ entity && entity.display_name }
                    ariaLabel='Host inventory display name'
                    onCancel={ this.onCancel }
                    onSubmit={ this.onSubmit(setDisplayName) }
                />
                <TextInputModal
                    isOpen={ isAnsibleHostModalOpen }
                    title='Edit Ansible host'
                    value={ entity && this.getAnsibleHost() }
                    ariaLabel='Ansible host'
                    onCancel={ this.onCancel }
                    onSubmit={ this.onSubmit(setAnsibleHost) }
                />
            </Fragment>
        );
    }
}

SystemCard.propTypes = {
    detailLoaded: PropTypes.bool,
    entity: PropTypes.shape({
        // eslint-disable-next-line camelcase
        display_name: PropTypes.string
    }),
    properties: PropTypes.shape({
        cpuNumber: PropTypes.number,
        sockets: PropTypes.number,
        coresPerSocket: PropTypes.number,
        ramSize: PropTypes.string,
        storage: PropTypes.arrayOf(PropTypes.shape({
            device: PropTypes.string,
            // eslint-disable-next-line camelcase
            mount_point: PropTypes.string,
            options: PropTypes.shape({}),
            type: PropTypes.string
        }))
    }),
    handleClick: PropTypes.func,
    setDisplayName: PropTypes.func,
    setAnsibleHost: PropTypes.func
};
SystemCard.defaultProps = {
    detailLoaded: false,
    entity: {},
    properties: {},
    handleClick: () => undefined,
    setDisplayName: () => undefined,
    setAnsibleHost: () => undefined
};

function mapDispatchToProps(dispatch) {
    const reloadWrapper = (id, event) => {
        event.payload.then(data => {
            dispatch(loadEntity(id, { hasItems: true }));
            return data;
        });

        return event;
    };

    return {
        setDisplayName: (id, value) => {
            dispatch(reloadWrapper(id, editDisplayName(id, value)));
        },

        setAnsibleHost: (id, value) => {
            dispatch(reloadWrapper(id, editAnsibleHost(id, value)));
        }
    };
}

export default connect(({
    entityDetails: {
        entity
    },
    systemProfileStore: {
        systemProfile
    }
}) => ({
    entity,
    detailLoaded: systemProfile && systemProfile.loaded,
    properties: propertiesSelector(systemProfile)
}), mapDispatchToProps)(SystemCard);
