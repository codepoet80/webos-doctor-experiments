enyo.kind({
    name: "enyo.FindApps.Magazine.EditionsMgrHelper",
    kind: enyo.Component,
    components: [{
        kind: "enyo.FindApps.Magazine.EditionsMgrService",
        name: "editionsMgrService"
    }],
    getEdition: function(acCountry, deviceLocale) {
        if (acCountry && deviceLocale) {
            this.$.editionsMgrService.getEdition(acCountry, deviceLocale);
        } else {
            this.error("AC Country and device locale not available to trigger edition fetch");
        }
    }
});
