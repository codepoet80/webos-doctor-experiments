findApps.States = {
    _statesUS: [{
        caption: $L("State..."),
        value: "STATE"
    }, // State names should not be localized
    {
        caption: $L("Alabama"),
        value: "AL"
    }, {
        caption: $L("Alaska"),
        value: "AK"
    }, {
        caption: $L("American Samoa"),
        value: "AS"
    }, {
        caption: $L("Arizona"),
        value: "AZ"
    }, {
        caption: $L("Arkansas"),
        value: "AR"
    }, {
        caption: $L("AF Americas"),
        value: "AA"
    }, {
        caption: $L("AF Europe"),
        value: "AE"
    }, {
        caption: $L("AF Pacific"),
        value: "AP"
    }, {
        caption: $L("California"),
        value: "CA"
    }, {
        caption: $L("Colorado"),
        value: "CO"
    }, {
        caption: $L("Connecticut"),
        value: "CT"
    }, {
        caption: $L("Delaware"),
        value: "DE"
    }, {
        caption: $L("District of Columbia"),
        value: "DC"
    }, {
        caption: $L("Federated Micronesia"),
        value: "FM"
    }, {
        caption: $L("Florida"),
        value: "FL"
    }, {
        caption: $L("Georgia"),
        value: "GA"
    }, {
        caption: $L("Guam"),
        value: "GU"
    }, {
        caption: $L("Hawaii"),
        value: "HI"
    }, {
        caption: $L("Idaho"),
        value: "ID"
    }, {
        caption: $L("Illinois"),
        value: "IL"
    }, {
        caption: $L("Indiana"),
        value: "IN"
    }, {
        caption: $L("Iowa"),
        value: "IA"
    }, {
        caption: $L("Kansas"),
        value: "KS"
    }, {
        caption: $L("Kentucky"),
        value: "KY"
    }, {
        caption: $L("Louisiana"),
        value: "LA"
    }, {
        caption: $L("Maine"),
        value: "ME"
    }, {
        caption: $L("Marshall Islands"),
        value: "MH"
    }, {
        caption: $L("Maryland"),
        value: "MD"
    }, {
        caption: $L("Massachusetts"),
        value: "MA"
    }, {
        caption: $L("Michigan"),
        value: "MI"
    }, {
        caption: $L("Minnesota"),
        value: "MN"
    }, {
        caption: $L("Mississippi"),
        value: "MS"
    }, {
        caption: $L("Missouri"),
        value: "MO"
    }, {
        caption: $L("Montana"),
        value: "MT"
    }, {
        caption: $L("Nebraska"),
        value: "NE"
    }, {
        caption: $L("Nevada"),
        value: "NV"
    }, {
        caption: $L("New Hampshire"),
        value: "NH"
    }, {
        caption: $L("New Jersey"),
        value: "NJ"
    }, {
        caption: $L("New Mexico"),
        value: "NM"
    }, {
        caption: $L("New York"),
        value: "NY"
    }, {
        caption: $L("North Carolina"),
        value: "NC"
    }, {
        caption: $L("North Dakota"),
        value: "ND"
    }, {
        caption: $L("N. Mariana Islands"),
        value: "MP"
    }, {
        caption: $L("Ohio"),
        value: "OH"
    }, {
        caption: $L("Oklahoma"),
        value: "OK"
    }, {
        caption: $L("Oregon"),
        value: "OR"
    }, {
        caption: $L("Palau"),
        value: "PW"
    }, {
        caption: $L("Pennsylvania"),
        value: "PA"
    }, {
        caption: $L("Puerto Rico"),
        value: "PR"
    }, {
        caption: $L("Rhode Island"),
        value: "RI"
    }, {
        caption: $L("South Carolina"),
        value: "SC"
    }, {
        caption: $L("South Dakota"),
        value: "SD"
    }, {
        caption: $L("Tennessee"),
        value: "TN"
    }, {
        caption: $L("Texas"),
        value: "TX"
    }, {
        caption: $L("Utah"),
        value: "UT"
    }, {
        caption: $L("Vermont"),
        value: "VT"
    }, {
        caption: $L("Virgin Islands"),
        value: "VI"
    }, {
        caption: $L("Virginia"),
        value: "VA"
    }, {
        caption: $L("Washington"),
        value: "WA"
    }, {
        caption: $L("West Virginia"),
        value: "WV"
    }, {
        caption: $L("Wisconsin"),
        value: "WI"
    }, {
        caption: $L("Wyoming"),
        value: "WY"
    }, ],
    _statesCA: [{
        caption: $L("Province/Territory..."),
        value: "STATE"
    }, // State names should not be localized
    {
        caption: $L("Alberta"),
        value: "AB"
    }, {
        caption: $L("British Columbia"),
        value: "BC"
    }, {
        caption: $L("Manitoba"),
        value: "MB"
    }, {
        caption: $L("New Brunswick"),
        value: "NB"
    }, {
        caption: $L("Newfoundland and Labrador"),
        value: "NL"
    }, {
        caption: $L("Northwest Territories"),
        value: "NT"
    }, {
        caption: $L("Nova Scotia"),
        value: "NS"
    }, {
        caption: $L("Nunavut"),
        value: "NU"
    }, {
        caption: $L("Ontario"),
        value: "ON"
    }, {
        caption: $L("Prince Edward Island"),
        value: "PE"
    }, {
        caption: $L("Quebec"),
        value: "QC"
    }, {
        caption: $L("Saskatchewan"),
        value: "SK"
    }, {
        caption: $L("Yukon"),
        value: "YT"
    }],
    _statesAU: [{
        caption: $L("State..."),
        value: "STATE"
    }, // State names should not be localized
    {
        caption: $L("Australian Capital Territory"),
        value: "ACT"
    }, {
        caption: $L("New South Wales"),
        value: "NSW"
    }, {
        caption: $L("Northern Territory"),
        value: "NT"
    }, {
        caption: $L("Queensland"),
        value: "QLD"
    }, {
        caption: $L("South Australia"),
        value: "SA"
    }, {
        caption: $L("Tasmania"),
        value: "TAS"
    }, {
        caption: $L("Victoria"),
        value: "VIC"
    }, {
        caption: $L("Western Australia"),
        value: "WA"
    }],
    getStates: function(country) {
        var states = undefined;
        switch (country) {
        case "US":
            states = this._statesUS;
            break;
        case "CA":
            states = this._statesCA;
            break;
        case "AU":
            states = this._statesAU;
            break;
        default:
            break;
        }
        
        return states;
    }
}
