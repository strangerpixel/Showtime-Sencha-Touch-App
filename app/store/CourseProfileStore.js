Ext.define('Showtime.store.CourseProfileStore', {
    extend: 'Ext.data.Store',
    requires: 'Ext.ux.proxy.JsonPCache',
    config: {
        storeId: 'courseProfiles',
        model: 'Showtime.model.ProfileModel',
        autoLoad: false,
        proxy: {
            type: 'jsonpcache',
            cacheKey: 'CourseProfileCache',
            //url set when created
            reader:{
                type: 'json',
                rootProperty: 'data.Profiles'
            },
            timeout: 7000,
            listeners: {
                exception:function (proxy, response, operation, eOpts) {
                    console.log('exception loading profiles for a course');

                    Ext.ComponentQuery.query('#explore-panel')[0].unmask();

                    if (!navigator.onLine) {
                        //not online
                        //
                    } else {
                        //online so some other error
                        //timeout?
                        //can't connect to showtime server?
                    }
                }
            }
        },
        urlChanged: false,
        endReached: false,
        oldPage: 0,
        pageSize: 64 //important this needs to be greater than and in multiples of the number of profiles per page (8) e.g. 16, 24, 32 etc
    }
});