var AppCatalog = {
    Config: {
        wsTimeout: 60000,
        defaultPageSize: 50,
        testServerErrors: false,
        CacheConfig: {
            enabled: true, // enable/disable caching system wide
            persistent: false, // enable/disable persistent caching
            longTermTTL: (1000 * 60 * 60), //expires after 1 hour
            shortTermTTL: (1000 * 60 * 15) //expires after 15 minutes
        }
    }
};
